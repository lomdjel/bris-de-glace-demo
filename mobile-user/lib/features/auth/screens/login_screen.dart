import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/auth_service.dart';
import '../../../config/theme.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = context.read<AuthProvider>();
      authProvider.clearError();
      final email = _emailController.text.trim();
      await authProvider.login(
        email,
        _passwordController.text,
      );

      if (!mounted) return;

      // Success - go back
      if (authProvider.isAuthenticated) {
        Navigator.pop(context);
        return;
      }

      // Handle "Account not verified" - show dialog with resend option
      if (authProvider.unverifiedEmail != null) {
        final unverifiedEmail = authProvider.unverifiedEmail!;
        authProvider.clearError();
        _showAccountNotVerifiedDialog(unverifiedEmail);
      }
    }
  }

  void _showAccountNotVerifiedDialog(String email) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Compte non vérifié'),
        content: const Text(
          'Votre compte n\'a pas encore été vérifié. '
          'Vérifiez votre boîte email ou renvoyez un email de validation.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fermer'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final authService = AuthService();
              final result = await authService.resendVerification(email);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(result.success
                    ? 'Email de vérification renvoyé !'
                    : (result.error ?? 'Erreur lors de l\'envoi')),
                  backgroundColor: result.success ? AppColors.available : AppColors.error,
                ),
              );
            },
            child: const Text('Renvoyer l\'email'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),
                // Logo placeholder
                Container(
                  height: 100,
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.car_repair,
                    size: 80,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Bris de Glace',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Trouvez un artisan près de chez vous',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer votre email';
                    }
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                        .hasMatch(value)) {
                      return 'Email invalide';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Mot de passe',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer votre mot de passe';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ForgotPasswordScreen(),
                        ),
                      );
                    },
                    child: const Text('Mot de passe oublié ?'),
                  ),
                ),
                const SizedBox(height: 16),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    final isLoading = authProvider.state == AuthState.loading;
                    final hasError = authProvider.state == AuthState.error && authProvider.error != null;

                    // Detect "Account not verified" and show dialog
                    if (hasError) {
                      final raw = authProvider.rawError ?? '';
                      if (raw.contains('not verified')) {
                        final email = authProvider.unverifiedEmail ?? '';
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          authProvider.clearError();
                          _showAccountNotVerifiedDialog(email);
                        });
                        return ElevatedButton(
                          onPressed: null,
                          child: const Text('Se connecter'),
                        );
                      }
                    }

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (hasError) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: AppColors.error.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    authProvider.error!,
                                    style: const TextStyle(color: AppColors.error, fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        ElevatedButton(
                          onPressed: isLoading ? null : _handleLogin,
                          child: isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Se connecter'),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Pas encore de compte ?'),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const RegisterScreen(),
                          ),
                        );
                      },
                      child: const Text('S\'inscrire'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
