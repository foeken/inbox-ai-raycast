import { LaunchProps } from "@raycast/api";
import ActionList from "./components/ActionList";

interface CommandContext {
  actionId?: string;
  originalInput?: string;
}

export default function Command(props: LaunchProps<{ launchContext: CommandContext }>) {
  return (
    <ActionList
      commandName="audio"
      supportedTypes={['askAI', 'realtimeAI']}
      actionTitle="Audio"
      urlScheme="audio"
      launchContext={props.launchContext}
    />
  );
}

// Add this at the top level of the file to help with debugging
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});