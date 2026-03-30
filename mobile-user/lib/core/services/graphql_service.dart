import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../services/storage_service.dart';
import '../../config/env.dart';

class GraphQLService {
  final StorageService _storageService;
  late ValueNotifier<GraphQLClient> client;

  GraphQLService(this._storageService) {
    _initClient();
  }

  void _initClient() {
    final httpLink = HttpLink(Env.graphqlEndpoint);

    final authLink = AuthLink(
      getToken: () async {
        final token = await _storageService.getToken();
        return token != null ? 'Bearer $token' : null;
      },
    );

    final link = authLink.concat(httpLink);

    client = ValueNotifier(
      GraphQLClient(
        link: link,
        cache: GraphQLCache(store: InMemoryStore()),
      ),
    );
  }

  void updateClient() {
    _initClient();
  }

  // WebSocket pour subscriptions
  GraphQLClient getSubscriptionClient() {
    final wsLink = WebSocketLink(
      Env.wsEndpoint,
      config: SocketClientConfig(
        autoReconnect: true,
        inactivityTimeout: const Duration(seconds: 30),
        initialPayload: () async {
          final token = await _storageService.getToken();
          return {
            'headers': {
              'Authorization': token != null ? 'Bearer $token' : '',
            },
          };
        },
      ),
    );

    return GraphQLClient(
      link: wsLink,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }
}
