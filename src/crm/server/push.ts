import webPush from "web-push";
import { serviceDb } from "./db";
export async function sendBrowserNotifications() {
  if (!process.env.NEXT_PUBLIC_VAPID_KEY || !process.env.VAPID_PRIVATE_KEY)
    return { sent: 0 };
  webPush.setVapidDetails(
    "mailto:kontakt@webstudio-expert.de",
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  const svc = serviceDb();
  const [{ data: events }, { data: subscriptions }] = await Promise.all([
    svc
      .from("crm_notifications")
      .select("id,href")
      .is("push_sent_at", null)
      .is("read_at", null)
      .limit(30),
    svc.from("crm_push_subscriptions").select("*"),
  ]);
  if (!subscriptions?.length) return { sent: 0 };
  let sent = 0;
  for (const event of events || []) {
    let accepted = false;
    for (const subscription of subscriptions || []) {
      try {
        await webPush.sendNotification(
          subscription.subscription,
          JSON.stringify({
            title: "Webstudio Expert",
            body: "Neue Benachrichtigung im CRM",
            href: event.href,
          }),
        );
        accepted = true;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410)
          await svc
            .from("crm_push_subscriptions")
            .delete()
            .eq("id", subscription.id);
      }
    }
    if (accepted)
      await svc
        .from("crm_notifications")
        .update({ push_sent_at: new Date().toISOString() })
        .eq("id", event.id);
    if (accepted) sent++;
  }
  return { sent };
}
