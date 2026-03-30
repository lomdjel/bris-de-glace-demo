import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:provider/provider.dart';

import 'config/env.dart';
import 'config/theme.dart';
import 'core/services/storage_service.dart';
import 'core/services/graphql_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/api_service.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/artisans_provider.dart';
import 'core/providers/interventions_provider.dart';
import 'core/providers/addresses_provider.dart';
import 'features/home/screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Stripe.publishableKey = Env.stripePublishableKey;
  await initHiveForFlutter();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final storageService = StorageService();
    final authService = AuthService();
    final graphqlService = GraphQLService(storageService);
    final apiService = ApiService(storageService);

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            authService: authService,
            storageService: storageService,
            graphqlService: graphqlService,
          )..init(),
        ),
        Provider<ApiService>.value(value: apiService),
        ChangeNotifierProvider(create: (_) => ArtisansProvider(apiService)),
        ChangeNotifierProvider(create: (_) => InterventionsProvider(apiService)),
        ChangeNotifierProvider(create: (_) => AddressesProvider(apiService)),
      ],
      child: GraphQLProvider(
        client: graphqlService.client,
        child: MaterialApp(
          title: 'Bris de Glace',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('fr', 'FR'),
            Locale('en'),
          ],
          locale: const Locale('fr', 'FR'),
          home: const HomeScreen(),
        ),
      ),
    );
  }
}

