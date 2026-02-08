import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageCircle,
  FileText,
  Video,
  Mail,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const faqs = [
  {
    question: "How do I enroll in a course?",
    answer:
      "Navigate to the Courses page from the sidebar, browse available courses, and click the 'Enroll' button on any course card. You'll immediately have access to all course materials.",
  },
  {
    question: "How do I submit an assignment?",
    answer:
      "Go to the Assignments page, find your assignment, and click 'Submit'. You can enter text content and optionally attach a file URL. Make sure to submit before the deadline!",
  },
  {
    question: "How are quizzes graded?",
    answer:
      "Quizzes are auto-graded immediately upon submission. For multiple choice and true/false questions, answers are checked automatically. Short answer questions are compared against the correct answer (case-insensitive).",
  },
  {
    question: "Can I retake a quiz?",
    answer:
      "Quiz retake policies are set by individual instructors. Currently, the platform allows one attempt per quiz. Contact your instructor if you need special accommodations.",
  },
  {
    question: "How do I contact my instructor?",
    answer:
      "Use the Messages feature in the sidebar to send direct messages to your instructors. You can also join scheduled Meetings for live video sessions and office hours.",
  },
  {
    question: "How do I track my progress?",
    answer:
      "Visit the Analytics page to view your course progress, assignment completion rates, quiz scores, and overall performance metrics across all enrolled courses.",
  },
  {
    question: "What file formats are supported for assignments?",
    answer:
      "Currently, you can submit text content directly and link to external files (Google Drive, Dropbox, etc.). Support for direct file uploads is coming soon.",
  },
  {
    question: "How do I change my account settings?",
    answer:
      "Click on Settings in the sidebar to update your profile, notification preferences, appearance settings, and security options including password changes.",
  },
];

const resources = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of using the platform",
    icon: BookOpen,
    href: "#",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    icon: Video,
    href: "#",
  },
  {
    title: "Documentation",
    description: "Detailed platform documentation",
    icon: FileText,
    href: "#",
  },
  {
    title: "Community Forum",
    description: "Connect with other users",
    icon: MessageCircle,
    href: "#",
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Your message has been sent! We'll respond within 24 hours.");
    setContactForm({ subject: "", message: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground mt-2">
            Find answers to common questions or get in touch with support
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>

        {/* Quick Resources */}
        <div className="grid gap-4 md:grid-cols-4">
          {resources.map((resource) => (
            <Card
              key={resource.title}
              className="cursor-pointer hover:shadow-md transition-shadow group"
            >
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3 group-hover:bg-primary/10 transition-colors">
                  <resource.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-sm">{resource.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {resource.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to the most common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No FAQs match your search. Try a different query or contact support.
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Send us a message.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input
                  id="subject"
                  placeholder="What do you need help with?"
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question in detail..."
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  className="min-h-[120px]"
                  required
                />
              </div>
              <Button type="submit">Send Message</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
