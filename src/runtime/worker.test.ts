import test from "node:test";
import assert from "node:assert/strict";

import type { QueryResult } from "pg";

import { DummyAdapter } from "./adapters/DummyAdapter";
import { InMemoryOperationClaimStore } from "./operation-claim";
import { RuntimeManager } from "./runtime-manager";
import type { BotAdapter } from "./types";
import type { BotOperation } from "../types/models";

function mockQueryResult<T extends Record<string, unknown> = Record<string, unknown>>(rows: T[] = [] as T[]): QueryResult<T> {
  return {
    command: "SELECT",
    rowCount: rows.length,
    oid: 0,
    rows,
    fields: [],
  } as QueryResult<T>;
}

function makeOperation(overrides: Partial<BotOperation> = {}): BotOperation {
  const now = new Date().toISOString();

  return {
    id: "op-123",
    bot_id: "bot-123",
    community_id: "community-123",
    operation_type: "start",
    phase: "none",
    status: "pending",
    requested_by: null,
    requested_at: now,
    claimed_by: null,
    claimed_at: null,
    started_at: null,
    completed_at: null,
    attempt_count: 0,
    last_error: null,
    correlation_id: "corr-123",
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

test("DummyAdapter start", async () => {
  const adapter = new DummyAdapter();
  const result = await adapter.start("bot-123", "community-123");
  assert.equal(result.ok, true);
  assert.equal(result.state, "running");
  assert.equal((await adapter.health("bot-123", "community-123")).state, "running");
});

test("DummyAdapter stop", async () => {
  const adapter = new DummyAdapter();
  await adapter.start("bot-456", "community-123");
  const result = await adapter.stop("bot-456", "community-123");
  assert.equal(result.ok, true);
  assert.equal(result.state, "stopped");
  assert.equal((await adapter.health("bot-456", "community-123")).state, "stopped");
});

test("DummyAdapter restart", async () => {
  const adapter = new DummyAdapter();
  const result = await adapter.restart("bot-789", "community-123");
  assert.equal(result.ok, true);
  assert.equal(result.state, "running");
  assert.equal((await adapter.health("bot-789", "community-123")).state, "running");
});

test("claim de operación", async () => {
  const store = new InMemoryOperationClaimStore([makeOperation({ id: "op-1", attempt_count: 0 })]);
  const claimed = await store.claimNext("worker-1");

  assert.equal(claimed?.status, "claimed");
  assert.equal(claimed?.claimed_by, "worker-1");
  assert.equal(claimed?.attempt_count, 1);
  assert.equal(await store.claimNext("worker-2"), null);
});

test("dos workers intentando reclamar", async () => {
  const store = new InMemoryOperationClaimStore([
    makeOperation({ id: "op-1" }),
    makeOperation({ id: "op-2" }),
  ]);

  const first = await store.claimNext("worker-1");
  const second = await store.claimNext("worker-2");

  assert.equal(first?.id, "op-1");
  assert.equal(second?.id, "op-2");
});

test("start happy path", async () => {
  const manager = new RuntimeManager(new DummyAdapter(), {
    query: async () => mockQueryResult(),
    audit: async () => undefined,
  });

  const result = await manager.processClaimedOperation(
    makeOperation({ operation_type: "start", status: "claimed" }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.finalState, "running");
  assert.equal(result.status, "completed");
});

test("stop happy path", async () => {
  const manager = new RuntimeManager(new DummyAdapter(), {
    query: async () => mockQueryResult(),
    audit: async () => undefined,
  });

  const result = await manager.processClaimedOperation(
    makeOperation({ operation_type: "stop", status: "claimed" }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.finalState, "stopped");
});

test("restart happy path", async () => {
  const manager = new RuntimeManager(new DummyAdapter(), {
    query: async () => mockQueryResult(),
    audit: async () => undefined,
  });

  const result = await manager.processClaimedOperation(
    makeOperation({ operation_type: "restart", status: "claimed" }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.finalState, "running");
});

test("adapter failure sets failed status and last_error", async () => {
  let lastError: string | null = null;
  const failingAdapter: BotAdapter = {
    async start() {
      return { ok: false, state: "error", message: "start failed" };
    },
    async stop() {
      return { ok: false, state: "error", message: "stop failed" };
    },
    async restart() {
      return { ok: false, state: "error", message: "restart failed" };
    },
    async health() {
      return { state: "error", healthy: false, message: "error" };
    },
  };

  const manager = new RuntimeManager(failingAdapter, {
    query: async (_text: string, values?: unknown[]) => {
      if (values && values[0] && typeof values[0] === "string") {
        lastError = values[0];
      }
      return mockQueryResult();
    },
    audit: async () => undefined,
  });

  const result = await manager.processClaimedOperation(
    makeOperation({ operation_type: "start", status: "claimed" }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, "failed");
  assert.equal(lastError, "start failed");
});
