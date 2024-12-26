import { LaunchProps, showToast, Toast, BrowserExtension, open } from "@raycast/api";
import ActionList from "./components/ActionList";
import { SavedAction } from "./actions";

interface CommandContext {
  actionId?: string;
  originalInput?: string;
}

export default function Command(props: LaunchProps<{ launchContext: CommandContext }>) {
  const handleActionSelect = async (action: SavedAction) => {
    try {
      const content = await BrowserExtension.getContent({ format: "markdown" });
      if (!content) {
        showToast({
          style: Toast.Style.Failure,
          title: "No Browser Content",
          message: "Please make sure the browser extension is installed and a webpage is active.",
        });
        return false;
      }

      const url = `inboxai://audio?action=${encodeURIComponent(action.id)}&originalInput=${encodeURIComponent(content)}`;
      try {
        await open(url);
        return true;
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: "Failed to launch Inbox AI. Is it installed?",
        });
        return false;
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to get browser content. Is the browser extension installed?",
      });
      return false;
    }
  };

  return (
    <ActionList
      commandName="audio_browser_content"
      supportedTypes={["askAI", "realtimeAI"]}
      actionTitle="Audio with Browser Content"
      urlScheme="audio"
      launchContext={props.launchContext}
      onActionSelect={handleActionSelect}
    />
  );
}

// Add this at the top level of the file to help with debugging
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
