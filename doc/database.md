
### Users

- id: (uuid được generate từ client đối với user ẩn danh, hoặc github user id nếu người đó đã login)
- userID: (uuid được generate từ client)

### Notes

- userID: map lấy từ client, được map với **users.userID**
```
    {
        "_index" : "wnote",
        "_type" : "note",
        "_id" : "fbcc5ec5-6e0e-4ac3-84cc-348fefdcc0d1",
        "_score" : 1.0,
        "_source" : {
          "content" : """{"blocks":[{"key":"4aqe4","text":"em đã khó tính với chị bao giờ đâu (luom)","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{},"children":[]}],"entityMap":{}}""",
          "shortContent" : {
            "shortText" : "em đã khó tính với chị bao giờ đâu (luom)",
            "shortImage" : null
          },
          "userID" : "8c1814b0-9e0c-4f5d-b92c-b091051929c2",
          "rawTextSearch" : "em đã khó tính với chị bao giờ đâu (luom)",
          "createdAt" : 1594871106815,
          "updatedAt" : 1594871106815,
          "deletedAt" : 1595810924420
        }
      },
```
