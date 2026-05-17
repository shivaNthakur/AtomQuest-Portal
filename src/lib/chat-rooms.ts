/** Socket.io room names for org / dept / team / channel */
export function orgRoom() {
  return "org_general";
}

export function deptRoom(departmentId: string) {
  return `dept_${departmentId}`;
}

export function teamRoom(teamId: string) {
  return `team_${teamId}`;
}

export function channelRoom(channelId: string) {
  return `channel_${channelId}`;
}
