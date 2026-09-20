import { useState } from "react";
import { useManagePost } from "@/hooks/useCommunity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PostActions({
  id,
  own,
  title,
  body,
}: {
  id: string;
  own: boolean;
  title: string;
  body: string;
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"edit" | "delete" | "report">(own ? "edit" : "report");
  const [editedTitle, setTitle] = useState(title);
  const [editedBody, setBody] = useState(body);
  const [reason, setReason] = useState("");
  const mutation = useManagePost(id);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!mutation.isPending) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAction(own ? "edit" : "report");
            setTitle(title);
            setBody(body);
          }}
        >
          {own ? "Manage post" : "Report post"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          {action === "delete"
            ? "Delete this post?"
            : action === "edit"
              ? "Edit your post"
              : "Report this post"}
        </DialogTitle>
        <DialogDescription>
          {action === "delete"
            ? "This permanently removes your post and its replies."
            : action === "edit"
              ? "Correct or clarify what you shared."
              : "Reports are stored privately for the moderation team. Do not include sensitive personal information."}
        </DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const input =
              action === "edit"
                ? { action, title: editedTitle, body: editedBody }
                : action === "report"
                  ? { action, reason }
                  : { action };
            mutation.mutate(input, {
              onSuccess: () => {
                setOpen(false);
                setReason("");
              },
            });
          }}
        >
          {action === "edit" ? (
            <>
              <Label htmlFor={`title-${id}`}>Title</Label>
              <Input
                id={`title-${id}`}
                value={editedTitle}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
              <Label htmlFor={`body-${id}`}>Post</Label>
              <Textarea
                id={`body-${id}`}
                value={editedBody}
                onChange={(e) => setBody(e.target.value)}
                required
                maxLength={10000}
                rows={6}
              />
            </>
          ) : null}
          {action === "report" ? (
            <>
              <Label htmlFor={`reason-${id}`}>What is the issue?</Label>
              <Textarea
                id={`reason-${id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                minLength={10}
                maxLength={2000}
                rows={4}
              />
            </>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                mutation.isPending ||
                (action === "report" && reason.trim().length < 10) ||
                (action === "edit" && (!editedTitle.trim() || !editedBody.trim()))
              }
              type="submit"
              variant={action === "delete" ? "destructive" : "default"}
            >
              {mutation.isPending
                ? "Saving…"
                : action === "delete"
                  ? "Delete permanently"
                  : action === "edit"
                    ? "Save changes"
                    : "Submit report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            {own && action === "edit" ? (
              <Button type="button" variant="ghost" onClick={() => setAction("delete")}>
                Delete post…
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
