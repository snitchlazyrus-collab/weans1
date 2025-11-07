// Simple Firebase Realtime Database wrapper
export class FirebaseDB {
  constructor(config) {
    this.baseUrl = config.databaseURL;
    this.initialized = false;
  }

  async get(path) {
    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`);
      return await response.json();
    } catch (e) {
      console.error('Firebase get error:', e);
      return null;
    }
  }

  async set(path, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (e) {
      console.error('Firebase set error:', e);
      return null;
    }
  }

  async update(path, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (e) {
      console.error('Firebase update error:', e);
      return null;
    }
  }

  async test() {
    try {
      await this.set('test', { working: true });
      const result = await this.get('test');
      console.log('DB Test:', result);
      return result ? 'WORKING ✅' : 'FAILED ❌';
    } catch (e) {
      console.error('DB Error:', e);
      return 'ERROR: ' + e.message;
    }
  }
}
