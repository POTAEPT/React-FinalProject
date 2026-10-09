import { EditProfile } from "@/components/account/edit-profile";
import { Modal } from "@/components/ui/modal";

export default function EditProfileModal() {
  return (
    <Modal title="แก้ไขโปรไฟล์">
      <EditProfile />
    </Modal>
  );
}
