import BlogHeader from "@/components/BlogHeader";
import BlogAiAssistant from "@/components/BlogAiAssistant";

export default function BlogAiAssistantPage() {
  return (
    <>
      <BlogHeader
        lang="pl"
        plUrl="/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik"
        enUrl="/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules"
      />
      <BlogAiAssistant />
    </>
  );
}
