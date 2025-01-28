# Get Trades by Wallet

## Endpoint

`GET /trades/{tokenAddress}/by-wallet/{owner}`

Gets the latest trades for a specific token and wallet address.

## Query Parameters

| Parameter    | Required | Description                                                                                                                                  |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| cursor       | No       | Cursor for pagination                                                                                                                        |
| showMeta     | No       | Set to 'true' to add metadata for from and to tokens                                                                                         |
| parseJupiter | No       | Set to 'true' to combine all transfers within a Jupiter swap into a single transaction. By default, each transfer is shown separately.       |
| hideArb      | No       | Set to 'true' to hide arbitrage or other transactions that don't have both the 'from' and 'to' token addresses matching the token parameter. |

## Response Format

```json
{
  "trades": [
    {
      "tx": "Transaction Signature",
      "amount": 1000,
      "priceUsd": 0.1,
      "volume": 100,
      "type": "buy",
      "wallet": "WalletAddress",
      "time": 1723726185254,
      "program": "jupiter"
    }
  ],
  "nextCursor": 1723726185254,
  "hasNextPage": true
}
```
