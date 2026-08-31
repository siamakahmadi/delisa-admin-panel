"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { FeedPostsManager } from "@/components/feed/posts-manager";
import { FeedAuthorsManager } from "@/components/feed/authors-manager";
import { FeedCommentsManager } from "@/components/feed/comments-manager";

export default function FeedPage() {
  return (
    <div>
      <PageHeader title="فید" subtitle="فید عمودی شبیه اینستاگرام ریلز — پست‌های ویدیو/عکس/متنی، نویسندگان، و کامنت‌ها را مدیریت کنید" />

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">پست‌ها</TabsTrigger>
          <TabsTrigger value="authors">نویسندگان</TabsTrigger>
          <TabsTrigger value="comments">کامنت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <FeedPostsManager />
        </TabsContent>
        <TabsContent value="authors">
          <FeedAuthorsManager />
        </TabsContent>
        <TabsContent value="comments">
          <FeedCommentsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
