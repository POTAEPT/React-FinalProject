// A slot keeps showing its last matched route during soft navigation. This
// catch-all matches every other URL with nothing, so the modal closes when the
// app moves on (e.g. to the new party after creating it).
export default function CatchAll() {
  return null;
}
