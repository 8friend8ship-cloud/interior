# HD Interior Research WebApp V001

인테리어 견적 플랫폼의 조사·정규화·견적·프런트 송출용 Apps Script 1차 실행본입니다.

## Source of truth

- Drive package: `HD_Interior_Research_WebApp_V001.zip`
- Drive file ID: `1fITWIkTmVyxRDKolvk_-GoVbKwPruZQQ`
- Production DB: `HD_Interior_Agent_DB_V001`
- Spreadsheet ID: `1nxPCrUvJ1k6LVvwoCnO3gtbO_faXmgqb7gG4HNjlQ4w`
- Branch: `feature/interior-research-webapp-v001`

## Included modules

- Gemini-free routine research queue
- Drive indexing and registered public URL/feed adapters
- Chrome Bridge task queue for Naver Real Estate, shopping, Coupang, Amazon and AliExpress
- Apartment complex and floorplan normalization
- Shared Material Master plus market-specific Product Offer records
- Product link health and replacement queue
- Trend Queens image/object registration
- 28/33-pyeong historical template estimate engine
- Front output JSON contract
- DRYWRITE Article export (`id`, `date`, `title`, `coverImageUrl`, `rawText`)
- SketchUp task queue
- Agent audit and daily report
- Four daily time triggers

## Safety

- `main` is not modified.
- Existing Drive files and SketchUp originals are never overwritten.
- Routine research and fixed calculations do not call Gemini.
- Login-page collection is delegated to the approved Chrome Bridge queue.
- Front apps must read APPROVED/PUBLISHED data only.
- Secrets belong in Apps Script Properties or Vercel server environment variables.

The full modular source is stored in the Drive ZIP until the standalone Apps Script project is created and linked.