import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export default function Component() {
  return (
    <Avatar>
      <AvatarImage alt="Kelly King" src="/origin/avatar-80-07.jpg" />
      <AvatarFallback>KK</AvatarFallback>
    </Avatar>
  );
}
