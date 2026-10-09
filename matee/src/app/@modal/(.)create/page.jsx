import { CreateParty } from "@/components/party/create-party";
import { Modal } from "@/components/ui/modal";

export default function CreateModal() {
  return (
    <Modal title="ตั้งตี้ใหม่">
      <CreateParty />
    </Modal>
  );
}
