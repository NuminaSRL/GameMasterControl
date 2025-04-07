#!/bin/bash

echo "Testando endpoint API di profilo utente"

# Testa l'API del profilo utente completo
echo -e "\n\nTest API: /api/feltrinelli/user-profile/test-user-id"
curl -s http://localhost:5000/api/feltrinelli/user-profile/test-user-id | jq .

# Testa l'API dei badge di gioco dell'utente
echo -e "\n\nTest API: /api/feltrinelli/user-game-badges/test-user-id/1"
curl -s http://localhost:5000/api/feltrinelli/user-game-badges/test-user-id/1 | jq .

# Testa l'API dei premi di gioco dell'utente
echo -e "\n\nTest API: /api/feltrinelli/user-game-rewards/test-user-id/1"
curl -s http://localhost:5000/api/feltrinelli/user-game-rewards/test-user-id/1 | jq .
