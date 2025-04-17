document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm');
  const shopName = document.getElementById('shopName');
  const shopPhone = document.getElementById('shopPhone');
  const shopLogo = document.getElementById('shopLogo');
  const settings = JSON.parse(localStorage.getItem('shopSettings')) || {};

  // Pre-fill saved settings
  if (shopName && settings.name) shopName.value = settings.name;
  if (shopPhone && settings.phone) shopPhone.value = settings.phone;

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = shopName.value.trim();
      const phone = shopPhone.value.trim();
      const logoFile = shopLogo.files[0];

      if (!name) {
        alert('Shop name is required');
        return;
      }

      const saveSettings = (logoData = '') => {
        const data = {
          name,
          phone,
          logo: logoData
        };
        localStorage.setItem('shopSettings', JSON.stringify(data));
        alert('Settings saved successfully');
      };

      if (logoFile) {
        const reader = new FileReader();
        reader.onload = () => saveSettings(reader.result);
        reader.readAsDataURL(logoFile);
      } else {
        saveSettings(settings.logo || '');
      }
    });
  }
});
