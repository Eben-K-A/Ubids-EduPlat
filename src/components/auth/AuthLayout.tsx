import { ReactNode } from "react";
import { GraduationCap, BookOpen, Users, Award } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  {
    icon: BookOpen,
    title: "Interactive Courses",
    description: "Engage with rich multimedia content",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Work together in real-time",
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Monitor your learning journey",
  },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">UBIDS EduPlat</span>
          </div>

          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Transform Your
                <br />
                <span className="text-primary">Learning Experience</span>
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-md">
                Join thousands of students and educators on the platform designed for modern education.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-2 rounded-lg bg-primary/20">
                    <feature.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-primary-foreground/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-primary-foreground/50">
            © 2024 UBIDS EduPlat. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-2 rounded-xl gradient-primary">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">UBIDS EduPlat</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
