export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: '🌿 MutaCare Backend API',
    version: '1.0.0',
    description: `
**AI Therapy Companion & Graded Exposure System for Selective Mutism** (PKM-KC 2026)

This REST API powers MutaCare, providing personalized psychological therapy companion features, Cognitive Behavioral Therapy (CBT) reflections, graded exposure simulation roleplays, speech-to-text integration, and real-time confidence tracking.

### Authentication
Protected endpoints require a **Bearer JWT Token** issued by Supabase Auth upon successful login or registration.
Sertakan Token pada header: \`Authorization: Bearer <your_access_token>\`
`,
    contact: {
      name: 'Tim MutaCare PKM-KC 2026',
      url: 'https://github.com/MBobyPratama/Be-MutaCare',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT Bearer Token. Dapatkan token dari endpoint /auth/login atau /auth/register.',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  tags: [
    { name: 'Health', description: 'Server health check & status endpoints' },
    { name: 'Authentication', description: 'User registration & login endpoints' },
    { name: 'User Profile', description: 'User profile management endpoints' },
    { name: 'Assessment', description: 'Initial psychological assessment & therapy plan generation' },
    { name: 'Mood Check-In', description: 'Daily mood & anxiety check-in with adaptive LLM companion' },
    { name: 'Dashboard', description: 'Daily therapy dashboard summary, missions & progress analytics' },
    { name: 'Virtual Simulation', description: 'Virtual exposure roleplays, Google STT audio processing & Claude AI replies' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API Server Status',
        description: 'Returns system operational status, timestamp, uptime, and environment.',
        security: [],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'MutaCare API is healthy and operational',
                  data: {
                    status: 'UP',
                    timestamp: '2026-08-14T17:00:00.000Z',
                    uptime: 42.1,
                    environment: 'development',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register New User Account',
        description: 'Creates a new user account with Supabase Auth and initializes profile.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password', 'confirmPassword'],
                properties: {
                  fullName: { type: 'string', example: 'Muhammad Boby Pratama' },
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: 'rahasia123' },
                  confirmPassword: { type: 'string', format: 'password', example: 'rahasia123' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Registrasi akun MutaCare berhasil',
                  data: {
                    user: {
                      id: 'c1f7a40b-7033-4f9e-a612-4c28479e0a01',
                      email: 'user@example.com',
                      fullName: 'Muhammad Boby Pratama',
                      nickname: null,
                      avatarUrl: null,
                    },
                    session: {
                      accessToken: 'eyJhbGciOi...',
                      refreshToken: '...',
                      expiresIn: 3600,
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation failed or email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login',
        description: 'Authenticates user email and password, returning JWT access token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: 'rahasia123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Login berhasil',
                  data: {
                    user: {
                      id: 'c1f7a40b-7033-4f9e-a612-4c28479e0a01',
                      email: 'user@example.com',
                      fullName: 'Muhammad Boby Pratama',
                      nickname: 'Boby',
                      avatarUrl: null,
                    },
                    session: {
                      accessToken: 'eyJhbGciOi...',
                      refreshToken: '...',
                      expiresIn: 3600,
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid email or password' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['User Profile'],
        summary: 'Get Authenticated User Profile',
        description: 'Retrieves current authenticated user details and assessment status.',
        responses: {
          '200': {
            description: 'Profile retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Profile retrieved successfully',
                  data: {
                    id: 'c1f7a40b-7033-4f9e-a612-4c28479e0a01',
                    fullName: 'Muhammad Boby Pratama',
                    nickname: 'Boby',
                    avatarUrl: null,
                    gender: 'Laki-laki',
                    dateOfBirth: '2005-02-03',
                    currentStreak: 3,
                    longestStreak: 5,
                    hasCompletedAssessment: true,
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized / Missing token' },
        },
      },
      patch: {
        tags: ['User Profile'],
        summary: 'Update User Profile',
        description: 'Updates nickname, gender, date of birth, or avatar URL.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nickname: { type: 'string', example: 'Boby' },
                  gender: { type: 'string', example: 'Laki-laki' },
                  dateOfBirth: { type: 'string', format: 'date', example: '2005-02-03' },
                  avatarUrl: { type: 'string', example: 'https://example.com/avatar.png' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated successfully' },
        },
      },
    },
    '/assessments': {
      post: {
        tags: ['Assessment'],
        summary: 'Submit Initial Psychological Assessment',
        description: 'Submits initial questionnaire answers to generate AI psychological analysis and initialize weekly Therapy Plan.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['anxietyScore', 'mutismSeverity', 'primaryTriggers', 'answersPayload'],
                properties: {
                  anxietyScore: { type: 'integer', minimum: 0, maximum: 100, example: 75 },
                  mutismSeverity: { type: 'string', enum: ['mild', 'moderate', 'severe'], example: 'moderate' },
                  primaryTriggers: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['school', 'strangers', 'store'],
                  },
                  answersPayload: {
                    type: 'object',
                    example: { q1: 'kadang-kadang', q2: ['cemas', 'takut'] },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Assessment evaluated and therapy plan initialized',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Initial assessment evaluated and therapy plan initialized',
                  data: {
                    assessmentId: 'b1a2c3d4-e5f6-7890-abcd-1234567890ab',
                    mutismSeverity: 'moderate',
                    aiAnalysisSummary: 'Pengguna memiliki tingkat kecemasan situasional moderat terutama di lingkungan publik baru dan sekolah.',
                    therapyPlan: {
                      planId: 'e1f2a3b4-5678-90ab-cdef-1234567890cd',
                      currentWeek: 1,
                      status: 'active',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/moods/check-in': {
      post: {
        tags: ['Mood Check-In'],
        summary: 'Submit Daily Mood Check-In',
        description: 'Logs daily mood & anxiety level and receives an empathetic response from AI Therapy Companion "Muta".',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mood', 'anxietyLevel'],
                properties: {
                  mood: { type: 'string', enum: ['happy', 'neutral', 'anxious', 'scared', 'sad'], example: 'anxious' },
                  anxietyLevel: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                  notes: { type: 'string', example: 'Merasa cemas karena besok ada tugas kelompok di kampus.' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Mood logged successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Mood logged successfully',
                  data: {
                    date: '2026-08-14',
                    mood: 'anxious',
                    anxietyLevel: 4,
                    aiCompanionMessage: 'Hari ini kamu terlihat sedikit cemas, Boby. Tidak apa-apa, mari mulai dengan relaksasi pernapasan singkat.',
                    recommendedAction: 'relaxation',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dashboard/daily': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get Daily Therapy Dashboard Summary',
        description: 'Retrieves daily summary, streak status, today missions, and progress analytics.',
        responses: {
          '200': {
            description: 'Daily dashboard retrieved',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Daily dashboard retrieved',
                  data: {
                    user: { nickname: 'Boby', currentStreak: 3 },
                    todayMood: { logged: true, mood: 'anxious', anxietyLevel: 4 },
                    aiCompanion: {
                      message: 'Hari ini kamu terlihat sedikit cemas, Boby. Mari mulai dengan relaksasi pernapasan singkat.',
                      recommendedMissionType: 'relaxation',
                    },
                    weeklyProgress: { weekNumber: 1, percentage: 68, confidenceScore: 60, anxietyAverage: 3.2 },
                    todayMissions: [
                      {
                        id: 'm1-uuid',
                        missionType: 'relaxation',
                        title: 'Relaksasi Pernapasan 4-6',
                        description: 'Latihan pernapasan 3 menit untuk menenangkan sistem saraf.',
                        status: 'completed',
                        targetReferenceId: null,
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    '/simulations/scenarios': {
      get: {
        tags: ['Virtual Simulation'],
        summary: 'Get Master Simulation Scenarios Catalogue',
        description: 'Retrieves active virtual exposure scenarios.',
        parameters: [
          {
            name: 'category',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['daily_life', 'academic', 'professional', 'social_family'] },
            description: 'Filter scenarios by category',
          },
        ],
        responses: {
          '200': { description: 'Scenarios retrieved' },
        },
      },
    },
    '/simulations/start': {
      post: {
        tags: ['Virtual Simulation'],
        summary: 'Start Virtual Roleplay Session',
        description: 'Initializes a new exposure roleplay session and returns initial AI greeting.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['scenarioId'],
                properties: {
                  scenarioId: { type: 'string', example: 'scen-kasir-1' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Simulation session started' },
        },
      },
    },
    '/simulations/{simulationId}/turn': {
      post: {
        tags: ['Virtual Simulation'],
        summary: 'Submit User Audio Speech Turn',
        description: 'Processes user speech audio via Google STT, uploads audio to Supabase Storage, and gets Claude AI in-character reply & supportive feedback.',
        parameters: [
          {
            name: 'simulationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Active simulation session ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio'],
                properties: {
                  audio: { type: 'string', format: 'binary', description: 'User speech recording audio file (.m4a, .wav, .mp3, .webm)' },
                  speechDurationSeconds: { type: 'number', example: 2.4 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Turn processed successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Turn processed successfully',
                  data: {
                    userTurn: {
                      transcription: 'Iya, mau pakai struk digital saja mas.',
                      speechDurationSeconds: 2.4,
                      audioUrl: 'https://xyz.supabase.co/storage/v1/object/public/audio-sessions/user_id/turn_1.m4a',
                    },
                    aiTurn: {
                      senderType: 'assistant',
                      text: 'Baik kak, nomor HP atau emailnya boleh disebutkan?',
                      supportiveFeedback: 'Responsmu terdengar sangat jelas dan tenang! Lanjutkan ke langkah berikutnya.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/simulations/{simulationId}/end': {
      post: {
        tags: ['Virtual Simulation'],
        summary: 'End Simulation Session & Generate CBT Summary',
        description: 'Concludes roleplay session, computes final confidence score, and generates CBT summary feedback.',
        parameters: [
          {
            name: 'simulationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  anxietyScoreAfter: { type: 'integer', minimum: 1, maximum: 5, example: 2 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Simulation concluded and evaluated' },
        },
      },
    },
  },
};
