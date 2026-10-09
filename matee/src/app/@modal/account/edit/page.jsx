import { EditProfile } from "@/components/account/edit-profile";
import { Modal } from "@/components/ui/modal";

export default function EditProfileModalDirect() {
  return (
    <Modal title="แก้ไขโปรไฟล์" closeHref="/account">
      <EditProfile />
    </Modal>
  );
}
