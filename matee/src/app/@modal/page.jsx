// The slot's own "/" route: no modal on the home page. Without it the slot
// would keep showing the last modal after a soft navigation back to "/".
export default function ModalHome() {
  return null;
}
