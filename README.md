PS C:\Users\kipronoh\Desktop\Lock-in\PitchMe-Backend\pitchme> npm run dev

> dev
> tsx watch src/index.ts

🚀 Server running on port 3000
<-- OPTIONS /auth/login
--> OPTIONS /auth/login 204 12ms
<-- POST /auth/login
--> POST /auth/login 200 2s
<-- OPTIONS /resumes
--> OPTIONS /resumes 204 1ms
<-- POST /resumes
--- Backend createResume ---
Received request body: {
  "personalInfo": {
    "fullName": "Fidel Langat",
    "email": "langat@gmail.com",
    "phone": "0111260308",
    "location": "kutus",
    "linkedIn": "linkedin.com/in/yourname",
    "portfolio": "yourname.dev"
  },
  "summary": "Innovative full-stack developer with a strong foundation in JavaScript, React, and backend technologies. Skilled in transforming complex requirements into user-friendly applications with exceptional performance. Experience leading development teams, conducting code reviews, and implementing automated testing strategies that increased code coverage to 85%.",
  "experience": [
    {
      "id": "1751576366745",
      "title": "ss",
      "company": "ss",
      "location": "ss",
      "startDate": "2025-08",
      "endDate": "",
      "current": true,
      "description": "Managed innovative solutions and processes, reducing response times by 40%."
    }
  ],
  "education": [
    {
      "id": "1751576394168",
      "degree": "ss",
      "school": "ss",
      "location": "ss",
      "graduationDate": "2025-08",
      "gpa": "",
      "startDate": "2025-08",
      "endDate": "2025-12"
    }
  ],
  "skills": [
    "Vue.js",
    "Node.js",
    "MongoDB",
    "AWS",
    "Figma",
    "Leadership"
  ],
  "projects": [
    {
      "id": "1751576425991",
      "title": "ssss",
      "description": "ssss",
      "technologies": [
        "Node.js"
      ],
      "link": "ddd",
      "name": "ssss",
      "startDate": "2025-08",
      "endDate": "2025-12"
    },
    {
      "id": "1751577623588",
      "title": "",
      "description": "s",
      "technologies": [
        "Node.js"
      ],
      "link": "ss",
      "startDate": "2025-08",
      "endDate": "2025-06"
    }
  ]
}
--- Backend createResume Error ---
Error occurred: ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "experience",
      0,
      "position"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "experience",
      0,
      "isCurrentRole"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": [
      "experience",
      0,
      "achievements"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "education",
      0,
      "institution"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "education",
      0,
      "field"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "projects",
      1,
      "name"
    ],
    "message": "Required"
  }
]
    at get error (file:///C:/Users/kipronoh/Desktop/Lock-in/PitchMe-Backend/pitchme/node_modules/zod/dist/esm/v3/types.js:39:31)
    at ZodObject.parse (file:///C:/Users/kipronoh/Desktop/Lock-in/PitchMe-Backend/pitchme/node_modules/zod/dist/esm/v3/types.js:114:22)
    at createResume (C:\Users\kipronoh\Desktop\Lock-in\PitchMe-Backend\pitchme\src\Resume\resume.controller.ts:45:48)
    at async dispatch (file:///C:/Users/kipronoh/Desktop/Lock-in/PitchMe-Backend/pitchme/node_modules/hono/dist/compose.js:22:17)
    at async <anonymous> (C:\Users\kipronoh\Desktop\Lock-in\PitchMe-Backend\pitchme\src\rate.middleware.ts:45:5)
    at async dispatch (file:///C:/Users/kipronoh/Desktop/Lock-in/PitchMe-Backend/pitchme/node_modules/hono/dist/compose.js:22:17)
    at async authMiddleware (C:\Users\kipronoh\Desktop\Lock-in\PitchMe-Backend\pitchme\src\middleware.ts:37:5)
    at async dispatch (file:///C:/Users/kipronoh/Desktop/Lock-in/PitchMe-Backend/pitchme/node_modules/hono/dist/compose.js:22:17)
    at async cors2 (file:///C:/Users/kipronoh/Desktop/Lock-in/PitchMe-Backend/pitchme/node_modules/hono/dist/middleware/cors/index.js:84:5)
    at async dispatch (file:///C:/Users/kipronoh/Desktop/Lock-in/PitchMe-Backend/pitchme/node_modules/hono/dist/compose.js:22:17) {
  issues: [
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'boolean',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'array',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    }
  ],
  addIssue: [Function (anonymous)],
  addIssues: [Function (anonymous)],
  errors: [
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'boolean',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'array',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    },
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: [Array],
      message: 'Required'
    }
  ]
}
Zod validation failed: [
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'experience', 0, 'position' ],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'boolean',
    received: 'undefined',
    path: [ 'experience', 0, 'isCurrentRole' ],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'array',
    received: 'undefined',
    path: [ 'experience', 0, 'achievements' ],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'education', 0, 'institution' ],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'education', 0, 'field' ],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'projects', 1, 'name' ],
    message: 'Required'
  }
]
--> POST /resumes 400 93ms
