# Trending Tokens API

## Endpoint

`GET /tokens/trending/:timeframe`

Returns trending tokens for a specific time interval.

## Available Timeframes

| Timeframe | Description |
| --------- | ----------- |
| 5m        | 5 minutes   |
| 15m       | 15 minutes  |
| 30m       | 30 minutes  |
| 1h        | 1 hour      |
| 2h        | 2 hours     |
| 3h        | 3 hours     |
| 4h        | 4 hours     |
| 5h        | 5 hours     |
| 6h        | 6 hours     |
| 12h       | 12 hours    |
| 24h       | 24 hours    |

## Response Format

```json
[
  {
    "token": {
      "name": "Jupiter Perps LP",
      "symbol": "JLP",
      "mint": "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
      "uri": "https://static.jup.ag/jlp/metadata.json",
      "decimals": 6,
      "image": "https://image.solanatracker.io/proxy?url=https%3A%2F%2Fstatic.jup.ag%2Fjlp%2Ficon.png",
      "description": "JLP is the liquidity provider token for Jupiter Labs Perpetual.",
      "hasFileMetaData": true
    },
    "pools": [...],
    "events": {...},
    "risk": {...}
  },
  ...
]
```

## Examples

### Get trending tokens for the last hour (default):

`GET /tokens/trending`

### Get trending tokens for the last 15 minutes:

`GET /tokens/trending/15m`

### Get trending tokens for the last 24 hours:

`GET /tokens/trending/24h`
