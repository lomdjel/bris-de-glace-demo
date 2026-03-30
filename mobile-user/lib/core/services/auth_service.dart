import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../config/env.dart';

class AuthResult {
  final bool success;
  final String? token;
  final Map<String, dynamic>? user;
  final String? error;
  final String? message;
  final bool requiresEmailVerification;

  AuthResult({
    required this.success,
    this.token,
    this.user,
    this.error,
    this.message,
    this.requiresEmailVerification = false,
  });
}

class AuthService {
  static const _errorTranslations = {
    'Invalid credentials': 'Email ou mot de passe incorrect',
    'Account not verified': 'Compte non vérifié. Vérifiez votre boîte email.',
    'Email already exists': 'Un compte avec cet email existe déjà',
  };

  static String translateError(String error) {
    return _errorTranslations[error] ?? error;
  }

  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${Env.apiEndpoint}/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);
      print('[AUTH] Login response: status=${response.statusCode}, body=${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return AuthResult(
          success: true,
          token: data['token'],
          user: data['user'],
        );
      } else {
        final msg = data['message'];
        final rawError = msg is List ? msg.join(', ') : (msg?.toString() ?? 'Erreur de connexion');
        return AuthResult(
          success: false,
          error: translateError(rawError),
          message: rawError,
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        error: 'Erreur réseau: ${e.toString()}',
      );
    }
  }

  Future<AuthResult> register({
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${Env.apiEndpoint}/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'phone': phone,
          'role': 'user',
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // If no token, email verification is required
        if (data['token'] == null) {
          return AuthResult(
            success: true,
            message: data['message'] ?? 'Inscription réussie. Vérifiez votre email.',
            requiresEmailVerification: true,
          );
        }
        return AuthResult(
          success: true,
          token: data['token'],
          user: data['user'],
        );
      } else {
        final rawError = data['message'] ?? 'Erreur d\'inscription';
        return AuthResult(
          success: false,
          error: translateError(rawError),
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        error: 'Erreur réseau: ${e.toString()}',
      );
    }
  }

  Future<AuthResult> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('${Env.apiEndpoint}/auth/request-reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return AuthResult(success: true);
      } else {
        return AuthResult(
          success: false,
          error: data['message'] ?? 'Erreur',
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        error: 'Erreur réseau: ${e.toString()}',
      );
    }
  }

  Future<void> requestMagicLink(String email) async {
    final response = await http.post(
      Uri.parse('${Env.apiEndpoint}/auth/magic-link'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      final data = jsonDecode(response.body);
      throw Exception(data['message'] ?? 'Erreur lors de l\'envoi du lien');
    }
  }

  Future<Map<String, dynamic>> verifyMagicLink(String token) async {
    final response = await http.get(
      Uri.parse('${Env.apiEndpoint}/auth/magic-verify?token=$token'),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    final data = jsonDecode(response.body);
    throw Exception(data['message'] ?? 'Lien invalide ou expiré');
  }

  Future<AuthResult> resendVerification(String email) async {
    try {
      final response = await http.post(
        Uri.parse('${Env.apiEndpoint}/auth/resend-verification'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return AuthResult(success: true);
      } else {
        return AuthResult(
          success: false,
          error: data['message'] ?? 'Erreur',
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        error: 'Erreur réseau: ${e.toString()}',
      );
    }
  }
}
