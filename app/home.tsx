import React, { useEffect, useState } from 'react';
import Home from '../components/Home';
import { getToken } from '../services/auth';
import { View, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      getToken().then(setToken);
    }
  }, [isFocused]);

  return (
    <View style={{ flex: 1 }}>
      <Home />
      <View style={{ padding: 16 }}>
        
{/*         <Text style={{ fontSize: 12, color: '#888' }}>Token : {token ? token : 'Aucun token trouvé'}</Text>
 */}      </View>
    </View>
  );
} 