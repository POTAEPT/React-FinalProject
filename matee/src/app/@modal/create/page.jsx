import { CreateParty } from "@/components/party/create-party";
import { Modal } from "@/components/ui/modal";

// The modal for a direct visit to /create, where there is no page to go back to.
export default function CreateModalDirect() {
  return (
    <Modal title="ตั้งตี้ใหม่" closeHref="/">
      <CreateParty />
    </Modal>
  );
}
