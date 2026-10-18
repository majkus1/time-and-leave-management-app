import BlogHeader from "@/components/BlogHeader";
import BlogOne from "@/components/BlogOne";

export default function BlogOnePage() {
  return (
    <>
      <BlogHeader lang="pl" plUrl="/blog/ewidencja-czasu-pracy-online" enUrl="/en/blog/time-tracking-online" />
      <BlogOne />
    </>
  );
}
