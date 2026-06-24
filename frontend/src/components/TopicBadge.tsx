interface TopicBadgeProps {
  name: string;
  color?: string; // Kept for backward compatibility but ignored
}

export default function TopicBadge({ name }: TopicBadgeProps) {
  return (
    <span className="topic-badge">
      {name}
    </span>
  );
}
