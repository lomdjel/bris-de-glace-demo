import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _tokenKey = 'auth_token';
  static const _userKey = 'user_data';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // Token sécurisé
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _secureStorage.delete(key: _tokenKey);
  }

  // Données utilisateur (non sensibles)
  Future<void> saveUserData(String userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, userData);
  }

  Future<String?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userKey);
  }

  Future<void> clearUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  // Effacer toutes les données
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
