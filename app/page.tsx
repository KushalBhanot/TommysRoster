import { CourseSearch } from "@/components/CourseSearch";
import { HomeFinder } from "@/components/HomeFinder";

// Home: ask a question and get matched, or browse by course.
export default function Home() {
  return (
    <>
      <div className="pt-10 sm:pt-16">
        <HomeFinder />
      </div>
      <div className="mt-20 sm:mt-28">
        <CourseSearch />
      </div>
    </>
  );
}
