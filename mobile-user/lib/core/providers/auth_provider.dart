import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/graphql_service.dart';

enum AuthState { initial, loading, authenticated, guest, error }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  final StorageService _storageService;
  final GraphQLService _graphqlService;

  AuthState _state = AuthState.initial;
  Map<String, dynamic>? _user;
  String? _error;
  String? _rawError;
  String? _message;
  String? _guestEmail;
  String? _guestToken;
  bool _requiresEmailVerification = false;
  String? _unverifiedEmail;

  AuthProvider({
    required AuthService authService,
    required StorageService storageService,
    required GraphQLService graphqlService,
  })  : _authService = authService,
        _storageService = storageService,
        _graphqlService = graphqlService;

  AuthState get state => _state;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;
  String? get rawError => _rawError;
  String? get message => _message;
  bool get requiresEmailVerification => _requiresEmailVerification;
  bool get isAuthenticated => _state == AuthState.authenticated;
  String? get unverifiedEmail => _unverifiedEmail;
  String? get guestEmail => _guestEmail;
  bool get isGuest => _state == AuthState.guest;

  Future<void> init() async {
    _state = AuthState.loading;
    notifyListeners();

    final token = await _storageService.getToken();
    final userData = await _storageService.getUserData();

    if (token != null && userData != null) {
      _user = jsonDecode(userData);
      _state = AuthState.authenticated;
    } else {
      _state = AuthState.guest;
    }

    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _state = AuthState.loading;
    _error = null;
    _rawError = null;
    _unverifiedEmail = null;
    notifyListeners();

    final result = await _authService.login(email, password);

    if (result.success && result.token != null) {
      await _storageService.saveToken(result.token!);
      if (result.user != null) {
        await _storageService.saveUserData(jsonEncode(result.user));
        _user = result.user;
      }
      _graphqlService.updateClient();
      _state = AuthState.authenticated;
      notifyListeners();
      return true;
    } else {
      _error = result.error;
      _rawError = result.message;
      if (result.message?.contains('not verified') == true) {
        _unverifiedEmail = email;
      }
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    String? phone,
  }) async {
    _state = AuthState.loading;
    _error = null;
    _requiresEmailVerification = false;
    _message = null;
    notifyListeners();

    final result = await _authService.register(
      email: email,
      password: password,
      phone: phone,
    );

    if (result.success && result.requiresEmailVerification) {
      _requiresEmailVerification = true;
      _message = result.message;
      _state = AuthState.guest;
      notifyListeners();
      return true;
    } else if (result.success && result.token != null) {
      await _storageService.saveToken(result.token!);
      if (result.user != null) {
        await _storageService.saveUserData(jsonEncode(result.user));
        _user = result.user;
      }
      _graphqlService.updateClient();
      _state = AuthState.authenticated;
      notifyListeners();
      return true;
    } else {
      _error = result.error;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  Future<bool> requestMagicLink(String email) async {
    try {
      await _authService.requestMagicLink(email);
      _guestEmail = email;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyMagicLink(String token) async {
    try {
      final result = await _authService.verifyMagicLink(token);
      _guestToken = result['token'];
      _guestEmail = result['email'];
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storageService.clearAll();
    _user = null;
    _guestEmail = null;
    _guestToken = null;
    _state = AuthState.guest;
    _graphqlService.updateClient();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    _rawError = null;
    if (_state == AuthState.error) {
      _state = AuthState.guest;
    }
    notifyListeners();
  }
}
