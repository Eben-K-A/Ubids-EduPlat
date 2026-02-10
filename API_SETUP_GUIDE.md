# Frontend API Setup Guide

The frontend has been configured to call the backend API instead of using mock data.

## ✅ What's Been Set Up

### 1. **API Client Service** (`src/services/api.ts`)
- Base HTTP client using native `fetch`
- Automatic JWT token injection in Authorization header
- Error handling with `ApiError` class
- API endpoints organized by module:
  - `authApi` - Login, register, logout, refresh
  - `usersApi` - Profile management
  - `coursesApi` - Course CRUD operations
  - `assignmentsApi` - Assignment management

### 2. **Custom React Hooks** (`src/hooks/useApi.ts`)
Using React Query for state management:
- `useCourses()` - Get all courses
- `useCourse(id)` - Get single course
- `useCreateCourse()` - Create course mutation
- `useUpdateCourse()` - Update course mutation
- `useDeleteCourse()` - Delete course mutation
- `useEnrollCourse()` - Enroll in course mutation
- `useAssignments()` - Get assignments
- `useSubmitAssignment()` - Submit assignment
- `useProfile()` - Get user profile
- And more...

### 3. **Updated Contexts**
- `AuthContext.tsx` - Now calls backend API for login/register
- `CourseContext.tsx` - Uses API hooks for course management

### 4. **Environment Configuration**
- `.env.local` file with API base URL
- Default: `http://localhost:4000/api/v1`

## 🔌 How to Use

### Login (from AuthContext)
```tsx
const { login } = useAuth();

try {
  await login({ email: "user@edu.com", password: "password123" });
  // User is now authenticated
} catch (error) {
  console.error(error.message);
}
```

### Fetch Courses
```tsx
import { useCourses } from "@/hooks/useApi";

function MyCourses() {
  const { data: courses, isLoading, error } = useCourses();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {courses?.map(course => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  );
}
```

### Create a Course
```tsx
import { useCreateCourse } from "@/hooks/useApi";

function CreateCourseForm() {
  const { mutate: createCourse, isPending } = useCreateCourse();
  
  const handleSubmit = (data) => {
    createCourse(data, {
      onSuccess: () => {
        // Course created successfully
      },
      onError: (error) => {
        console.error("Failed to create course:", error);
      }
    });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Get Single Course
```tsx
import { useCourse } from "@/hooks/useApi";

function CourseDetail({ courseId }) {
  const { data: course, isLoading } = useCourse(courseId);
  
  if (!course) return <div>Course not found</div>;
  
  return <div>{course.title}</div>;
}
```

## 📋 Available API Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Courses
- `GET /courses` - List all courses
- `GET /courses/:id` - Get single course
- `POST /courses` - Create course
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `POST /courses/:id/enroll` - Enroll in course
- `POST /courses/:id/unenroll` - Unenroll from course

### Assignments
- `GET /assignments` - List assignments
- `GET /assignments/:id` - Get single assignment
- `POST /assignments` - Create assignment
- `PUT /assignments/:id` - Update assignment
- `DELETE /assignments/:id` - Delete assignment
- `POST /assignments/:id/submit` - Submit assignment
- `POST /assignments/:id/submissions/:submissionId/grade` - Grade submission

### Users
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update profile
- `GET /users` - List users

## 🔑 Authentication Flow

1. **Login** → Backend returns `access_token` and `refresh_token`
2. **Store tokens** → Saved in localStorage
3. **Auto-attach token** → Sent in `Authorization: Bearer {token}` header
4. **Token expiry** → When 401 is returned, user is redirected to login
5. **Logout** → Tokens are cleared from localStorage

## ⚙️ Configuration

### Change API Base URL
Edit `.env.local`:
```
VITE_API_URL=http://your-backend-url/api/v1
```

## 🚀 Next Steps

1. **Start the backend**: `cd backend && npm run start:dev`
2. **Ensure Postgres & Redis are running**: `docker ps`
3. **Test login** in the frontend with a real backend user
4. **Update remaining contexts** to use API hooks (AssignmentContext, NotificationContext, etc.)
5. **Add error handling** for API failures (already started with `useApiErrorHandler`)

## 📝 Adding New API Endpoints

1. Add the endpoint in `src/services/api.ts`:
```tsx
export const myApi = {
  getItems: () => ApiClient.get("/my-endpoint"),
  createItem: (data: any) => ApiClient.post("/my-endpoint", data),
};
```

2. Create a hook in `src/hooks/useApi.ts`:
```tsx
export const useMyItems = () => {
  return useQuery({
    queryKey: ["items"],
    queryFn: () => myApi.getItems(),
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => myApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};
```

3. Use in your component:
```tsx
const { data: items } = useMyItems();
const { mutate: createItem } = useCreateItem();
```

## ✨ Features

- ✅ JWT token management
- ✅ Automatic token injection
- ✅ React Query caching
- ✅ Error handling
- ✅ Loading states
- ✅ Mutation optimism (optional)
- ✅ Query invalidation

## 🐛 Troubleshooting

**CORS errors?**
- Ensure backend has CORS enabled
- Check `.env` API URL is correct

**401 Unauthorized?**
- Token might be expired
- Check localStorage for valid access_token
- Try logging out and logging in again

**API call not happening?**
- Check Network tab in DevTools
- Verify backend is running on correct port
- Check `.env.local` for correct API URL

