// mainnet client — gitcoin-era BulkCheckout contract. all constants verified
// against real on-chain data (selector + topic0 extracted from historical txs,
// calldata encoding tested byte-for-byte against tx 0xb6f7312c…).
export const BULK_CHECKOUT = '0x7d655c57f71464B6f83811C55D84009Cd9f5221C';
export const ETH_TOKEN = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'; // lowercase for comparisons
export const TOPIC_DONATION = '0x3bb7428b25f9bdad9bd2faa4c6a7a9e5d5882657e96c1d24cc41c1d6c1910a98';

const RPCS = (process.env.ETH_RPCS || [
  'https://ethereum-rpc.publicnode.com',
  'https://cloudflare-eth.com',
  'https://eth.drpc.org',
  'https://eth-mainnet.public.blastapi.io',
  'https://1rpc.io/eth',
].join(',')).split(',');

let rpcIdx = 0;

export async function rpc(method, params) {
  let lastErr;
  for (let i = 0; i < RPCS.length; i++) {
    const url = RPCS[(rpcIdx + i) % RPCS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(15000),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message);
      rpcIdx = (rpcIdx + i) % RPCS.length;
      return j.result;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('all rpcs failed');
}

export const latestBlock = async () => parseInt(await rpc('eth_blockNumber', []), 16);

// DonationSent(address indexed token, uint256 indexed amount, address dest, address indexed donor)
// topics: [sig, token, amount, donor]; data: dest (one word)
export function parseDonationLog(lg) {
  return {
    token: ('0x' + lg.topics[1].slice(26)).toLowerCase(),
    amount_wei: BigInt(lg.topics[2]),
    donor: ('0x' + lg.topics[3].slice(26)).toLowerCase(),
    dest: ('0x' + lg.data.slice(26, 66)).toLowerCase(),
    tx_hash: lg.transactionHash,
    log_index: parseInt(lg.logIndex, 16),
    block_number: parseInt(lg.blockNumber, 16),
  };
}

// public rpcs cap getLogs ranges hard and differently (cloudflare 800, 1rpc 50,
// blastapi 10, publicnode non-archive only) — so fetch adaptively: try a range,
// and on failure split it in half down to a 10-block floor. the indexer cursor
// keeps steady-state passes tiny; only the first backfill pays the request count.
async function getLogsRange(from, to) {
  try {
    return await rpc('eth_getLogs', [{
      address: BULK_CHECKOUT,
      topics: [TOPIC_DONATION],
      fromBlock: '0x' + from.toString(16),
      toBlock: '0x' + to.toString(16),
    }]);
  } catch (e) {
    if (to - from < 10) throw e;
    const mid = from + Math.floor((to - from) / 2);
    return [...await getLogsRange(from, mid), ...await getLogsRange(mid + 1, to)];
  }
}

export async function fetchDonationLogs(fromBlock, toBlock) {
  const out = [];
  const CHUNK = 799;
  for (let from = fromBlock; from <= toBlock; from += CHUNK + 1) {
    const batch = await getLogsRange(from, Math.min(from + CHUNK, toBlock));
    for (const lg of batch) out.push(parseDonationLog(lg));
  }
  return out;
}

const blockTimeCache = new Map();
export async function blockTime(blockNumber) {
  if (blockTimeCache.has(blockNumber)) return blockTimeCache.get(blockNumber);
  const b = await rpc('eth_getBlockByNumber', ['0x' + blockNumber.toString(16), false]);
  const iso = new Date(parseInt(b.timestamp, 16) * 1000).toISOString();
  blockTimeCache.set(blockNumber, iso);
  if (blockTimeCache.size > 5000) blockTimeCache.delete(blockTimeCache.keys().next().value);
  return iso;
}
