export default {
  beforeCreate(event: any) {
    syncTitleFromGeneral(event);
  },
  beforeUpdate(event: any) {
    syncTitleFromGeneral(event);
  },
};

function syncTitleFromGeneral(event: any) {
  const { data } = event.params;
  if (data?.general?.title) {
    data.title = data.general.title;
  }
}
