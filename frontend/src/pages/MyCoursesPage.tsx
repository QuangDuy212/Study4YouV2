import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import enrollmentService, { type EnrollmentResponse } from "@/services/enrollmentService";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { getMediaUrl } from "@/lib/utils";

function ProgressRing({ size = 48, progress }: { size?: number; progress: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-primary/15" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        className="stroke-primary"
        strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" className="fill-primary" fontSize={11} fontWeight={700}>
        {progress}%
      </text>
    </svg>
  );
}

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentService.getMyCourses()
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8 pb-12 pt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">My Learning</h1>
          </div>
          <p className="text-muted-foreground">Continue where you left off</p>
        </motion.div>

        {loading ? (
          <div className="my-courses-page__grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="course-skeleton" style={{ height: 180 }} />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="my-courses-page__empty">
            <svg viewBox="0 0 96 96" fill="none" width={80} height={80}>
              <circle cx="48" cy="48" r="48" fill="rgba(99,102,241,0.08)" />
              <path d="M30 62V36a2 2 0 012-2h28a2 2 0 012 2v26l-16 8-16-8z" fill="rgba(99,102,241,0.2)" />
            </svg>
            <h3>No courses yet</h3>
            <p>Start learning by enrolling in a course.</p>
            <Link to="/courses" className="payment-btn payment-btn--buy" style={{ textDecoration: "none" }}>
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="my-courses-page__grid">
            {enrollments.map(enrollment => (
              <div key={enrollment.id} className="my-course-card">
                <div className="my-course-card__thumb">
                  {enrollment.courseThumbnailUrl ? (
                    <img src={getMediaUrl(enrollment.courseThumbnailUrl)} alt={enrollment.courseTitle} />
                  ) : (
                    <div className="my-course-card__thumb-placeholder" />
                  )}
                </div>
                <div className="my-course-card__body">
                  <h3 className="my-course-card__title">{enrollment.courseTitle}</h3>
                  <div className="my-course-card__meta">
                    <ProgressRing progress={enrollment.progress} />
                    <div className="my-course-card__meta-text">
                      <span className="my-course-card__progress-label">
                        {enrollment.progress === 100 ? "✅ Completed" : `${enrollment.progress}% complete`}
                      </span>
                      <span className="my-course-card__enrolled-date">
                        Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link
                    id={`continue-course-${enrollment.courseId}`}
                    to={`/learn/${enrollment.courseId}`}
                    className="my-course-card__btn"
                  >
                    {enrollment.progress === 100 ? "Review Course" : "Continue Learning →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
