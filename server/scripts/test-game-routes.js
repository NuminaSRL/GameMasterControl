import fetch from 'node-fetch';

// Modifica questa URL con l'URL del tuo servizio su Railway
const API_BASE_URL = 'https://web-production-868a0.up.railway.app';

async function testGameRoutes() {
  try {
    console.log(`Testando le route dei giochi Feltrinelli su ${API_BASE_URL}...`);
    
    // Test health check per verificare che il server sia attivo
    console.log('\nVerifica connessione al server:');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    console.log('Health check status:', healthResponse.status);
    
    // Test per verificare quale implementazione è in uso
    console.log('\n0. Test implementazione in uso:');
    try {
      // Aggiungiamo un header speciale per richiedere informazioni di debug
      const debugResponse = await fetch(`${API_BASE_URL}/api/feltrinelli/games`, {
        headers: {
          'X-Debug-Info': 'true'
        }
      });
      
      // Esaminiamo gli header della risposta
      console.log('Headers della risposta:');
      for (const [key, value] of debugResponse.headers.entries()) {
        if (key.toLowerCase().includes('x-') || key.toLowerCase().includes('server')) {
          console.log(`${key}: ${value}`);
        }
      }
      
      // Controlliamo anche il corpo della risposta
      const debugData = await debugResponse.json();
      console.log('Struttura della risposta:', Object.keys(debugData[0]));
      
      // Verifica se la risposta contiene campi specifici della nuova implementazione
      if (debugData[0] && typeof debugData[0].feltrinelli_id !== 'undefined') {
        console.log('✅ La risposta contiene campi specifici della NUOVA implementazione (feltrinelli_id)');
      } else {
        console.log('❌ La risposta NON contiene campi specifici della nuova implementazione');
      }
    } catch (debugError) {
      console.error('Errore durante il test di debug:', debugError.message);
    }
    
    // Test lista giochi
    console.log('\n1. Test lista giochi:');
    const gamesResponse = await fetch(`${API_BASE_URL}/api/feltrinelli/games`);
    const gamesData = await gamesResponse.json();
    console.log('Risposta status:', gamesResponse.status);
    console.log('Giochi trovati:', Array.isArray(gamesData) ? gamesData.length : 'Risposta non è un array');
    console.log('Primo gioco:', Array.isArray(gamesData) && gamesData.length > 0 ? gamesData[0] : 'Nessun gioco trovato');
    
    // Se abbiamo trovato almeno un gioco, testiamo anche gli altri endpoint
    if (Array.isArray(gamesData) && gamesData.length > 0) {
      const firstGameId = gamesData[0].id;
      
      // Test gioco specifico
      console.log(`\n2. Test gioco specifico (ID: ${firstGameId}):`);
      const gameResponse = await fetch(`${API_BASE_URL}/api/feltrinelli/games/${firstGameId}`);
      const gameData = await gameResponse.json();
      console.log('Risposta status:', gameResponse.status);
      console.log('Dettagli gioco:', gameData);
      
      // Test impostazioni gioco
      console.log(`\n3. Test impostazioni gioco (ID: ${firstGameId}):`);
      const settingsResponse = await fetch(`${API_BASE_URL}/api/feltrinelli/game-settings/${firstGameId}`);
      const settingsData = await settingsResponse.json();
      console.log('Risposta status:', settingsResponse.status);
      console.log('Impostazioni gioco:', settingsData);
      
      // Test badge gioco con gestione errori migliorata
      console.log(`\n4. Test badge gioco (ID: ${firstGameId}):`);
      try {
        const badgesResponse = await fetch(`${API_BASE_URL}/api/feltrinelli/games/${firstGameId}/badges`);
        console.log('Risposta status:', badgesResponse.status);
        
        if (badgesResponse.ok) {
          const badgesData = await badgesResponse.json();
          console.log('Badge trovati:', Array.isArray(badgesData) ? badgesData.length : 'Risposta non è un array');
          if (Array.isArray(badgesData) && badgesData.length > 0) {
            console.log('Primo badge:', badgesData[0]);
          }
        } else {
          // Prova a ottenere il messaggio di errore
          try {
            const errorData = await badgesResponse.json();
            console.log('Errore restituito dal server:', errorData);
          } catch (parseError) {
            const errorText = await badgesResponse.text();
            console.log('Risposta di errore (testo):', errorText);
          }
        }
      } catch (badgeError) {
        console.error('Errore durante la richiesta dei badge:', badgeError.message);
      }
      
      // Test endpoint alternativo per i badge
      console.log(`\n5. Test endpoint alternativo per i badge (tutti i badge):`);
      try {
        const allBadgesResponse = await fetch(`${API_BASE_URL}/api/feltrinelli/badges`);
        console.log('Risposta status:', allBadgesResponse.status);
        
        if (allBadgesResponse.ok) {
          const allBadgesData = await allBadgesResponse.json();
          console.log('Badge totali trovati:', Array.isArray(allBadgesData) ? allBadgesData.length : 'Risposta non è un array');
          if (Array.isArray(allBadgesData) && allBadgesData.length > 0) {
            console.log('Primo badge (da tutti):', allBadgesData[0]);
          }
        } else {
          console.log('Errore nella richiesta di tutti i badge');
        }
      } catch (allBadgesError) {
        console.error('Errore durante la richiesta di tutti i badge:', allBadgesError.message);
      }
    }
    
  } catch (error) {
    console.error('Errore durante il test delle route dei giochi:', error);
    console.error('Dettagli errore:', error.message);
  }
}

testGameRoutes();