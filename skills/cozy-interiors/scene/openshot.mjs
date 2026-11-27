// The open-plan rule for a tour shot (one definition, used by fitshots.mjs and check-openplan.mjs): a neighbouring area may show only BEHIND the subject, that is, every piece of it that appears in the frame stands farther from the camera than the subject's nearest point; it may sit on either side or straight through, never in front of the subject. The subject itself is a group of this area (check-openplan names a shot whose subject belongs to another area).
// nbrRule(THREE, camera, subjectBoxes, neighbourBoxes: [{ id, box }]) -> null when the shot passes, else the id of the first neighbour piece that stands in front of the subject. Boxes are THREE.Box3 in world mm; the camera is already placed.
export function nbrRule(T, camera, subjectBoxes, neighbourBoxes) {
  const cp = camera.position, dS = Math.min(...subjectBoxes.map((b) => b.distanceToPoint(cp))), cd = camera.getWorldDirection(new T.Vector3());
  for (const { id, box } of neighbourBoxes) {
    if (box.distanceToPoint(cp) >= dS) continue;   // not nearer than the subject's nearest point
    for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) for (let c = 0; c <= 4; c++) {   // a 5 x 5 x 5 grid of points in the box: one of them in the frame means the piece shows
      const p = new T.Vector3(box.min.x + (box.max.x - box.min.x) * a / 4, box.min.y + (box.max.y - box.min.y) * b / 4, box.min.z + (box.max.z - box.min.z) * c / 4);
      if (p.clone().sub(cp).dot(cd) < 50) continue; const q = p.project(camera); if (Math.abs(q.x) <= 1 && Math.abs(q.y) <= 1) return id;
    }
  }
  return null;
}
