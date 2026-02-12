import express from 'express';
import { db } from '../database.js';

export const analyticsRoutes = express.Router();

analyticsRoutes.get('/stats', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole === 'lecturer' || userRole === 'admin') {
            // Lecturer Stats

            // 1. Total Students (unique students in their courses)
            const totalStudentsQuery = await db.query(`
        SELECT COUNT(DISTINCT e."studentId") as count
        FROM enrollments e
        JOIN courses c ON e."courseId" = c.id
        WHERE c."lecturerId" = $1
      `, [userId]);
            const totalStudents = totalStudentsQuery.rows[0];

            // 2. Active Courses (published)
            const activeCoursesQuery = await db.query(`
        SELECT COUNT(*) as count
        FROM courses
        WHERE "lecturerId" = $1 AND status = 'published'
      `, [userId]);
            const activeCourses = activeCoursesQuery.rows[0];

            // 3. Total Submissions (for assignments in their courses)
            const totalSubmissionsQuery = await db.query(`
        SELECT COUNT(s.id) as count
        FROM submissions s
        JOIN assignments a ON s."assignmentId" = a.id
        JOIN courses c ON a."courseId" = c.id
        WHERE c."lecturerId" = $1
      `, [userId]);
            const totalSubmissions = totalSubmissionsQuery.rows[0];

            // 4. Total Quiz Attempts
            const totalQuizAttemptsQuery = await db.query(`
        SELECT COUNT(qa.id) as count
        FROM quiz_attempts qa
        JOIN quizzes q ON qa."quizId" = q.id
        JOIN courses c ON q."courseId" = c.id
        WHERE c."lecturerId" = $1 AND qa.status = 'completed'
      `, [userId]);
            const totalQuizAttempts = totalQuizAttemptsQuery.rows[0];

            // 5. Course Performance
            const coursePerformanceQuery = await db.query(`
        SELECT c.code as name, c."enrolledCount" as students, AVG(qa.score) as "avgScore"
        FROM courses c
        LEFT JOIN quizzes q ON c.id = q."courseId"
        LEFT JOIN quiz_attempts qa ON q.id = qa."quizId"
        WHERE c."lecturerId" = $1
        GROUP BY c.id, c.code, c."enrolledCount"
        LIMIT 5
       `, [userId]);
            const coursePerformance = coursePerformanceQuery.rows;


            res.json({
                totalStudents: parseInt(totalStudents.count),
                activeCourses: parseInt(activeCourses.count),
                totalSubmissions: parseInt(totalSubmissions.count),
                totalQuizAttempts: parseInt(totalQuizAttempts.count),
                coursePerformance: coursePerformance.map((c: any) => ({
                    ...c,
                    avgScore: Math.round(c.avgScore || 0)
                })),
                engagementData: [
                    { week: "Week 1", students: 45, completions: 38 },
                    { week: "Week 2", students: 52, completions: 44 },
                    { week: "Week 3", students: 49, completions: 41 },
                    { week: "Week 4", students: 58, completions: 52 },
                    { week: "Week 5", students: 62, completions: 55 },
                    { week: "Week 6", students: 68, completions: 61 },
                ],
                completionData: [
                    { name: "On Time", value: 75, color: "hsl(var(--success))" },
                    { name: "Late", value: 15, color: "hsl(var(--warning))" },
                    { name: "Missing", value: 10, color: "hsl(var(--destructive))" },
                ],
                quizScoreData: [
                    { range: "0-20%", count: 2 },
                    { range: "21-40%", count: 5 },
                    { range: "41-60%", count: 12 },
                    { range: "61-80%", count: 25 },
                    { range: "81-100%", count: 18 },
                ]
            });

        } else {
            // Student Stats

            // 1. Enrolled Courses
            const enrolledCoursesQuery = await db.query(`
        SELECT COUNT(*) as count
        FROM enrollments
        WHERE "studentId" = $1 AND status = 'active'
      `, [userId]);
            const enrolledCourses = enrolledCoursesQuery.rows[0];

            // 2. Average Progress
            const avgProgress = 0; // Placeholder

            // 3. Total Submissions by Student
            const mySubmissionsQuery = await db.query(`
        SELECT COUNT(*) as count FROM submissions WHERE "studentId" = $1
      `, [userId]);
            const mySubmissions = mySubmissionsQuery.rows[0];

            // 4. Total Quiz Attempts by Student
            const myQuizAttemptsQuery = await db.query(`
        SELECT COUNT(*) as count FROM quiz_attempts WHERE "studentId" = $1 AND status = 'completed'
      `, [userId]);
            const myQuizAttempts = myQuizAttemptsQuery.rows[0];

            // 5. Progress per Course (Enrolled)
            const myCoursesQuery = await db.query(`
        SELECT c.title as course, c.id
        FROM enrollments e
        JOIN courses c ON e."courseId" = c.id
        WHERE e."studentId" = $1
      `, [userId]);
            const myCourses = myCoursesQuery.rows;

            const studentProgress = await Promise.all(myCourses.map(async (course) => {
                // Count assignments completed
                const completedAssignmentsResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM submissions s
            JOIN assignments a ON s."assignmentId" = a.id
            WHERE s."studentId" = $1 AND a."courseId" = $2
          `, [userId, course.id]);
                const completedAssignments = completedAssignmentsResult.rows[0];

                // Count quizzes completed
                const completedQuizzesResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM quiz_attempts qa
            JOIN quizzes q ON qa."quizId" = q.id
            WHERE qa."studentId" = $1 AND q."courseId" = $2 AND qa.status = 'completed'
          `, [userId, course.id]);
                const completedQuizzes = completedQuizzesResult.rows[0];

                return {
                    course: course.course,
                    progress: 0, // Mock progress %
                    assignmentsCompleted: parseInt(completedAssignments.count),
                    quizzesCompleted: parseInt(completedQuizzes.count)
                };
            }));

            res.json({
                enrolledCourses: parseInt(enrolledCourses.count),
                avgProgress: 72, // hardcoded mock
                totalSubmissions: parseInt(mySubmissions.count),
                totalQuizAttempts: parseInt(myQuizAttempts.count),
                studentProgress,
                // Mock data for charts
                engagementData: [
                    { week: "Week 1", students: 45, completions: 38 },
                    { week: "Week 2", students: 52, completions: 44 },
                    { week: "Week 3", students: 49, completions: 41 },
                    { week: "Week 4", students: 58, completions: 52 },
                    { week: "Week 5", students: 62, completions: 55 },
                    { week: "Week 6", students: 68, completions: 61 },
                ],
            });
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
