import { Image, StyleSheet, Platform, Pressable } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import { useCallback, useState } from 'react';

let bleManager = new BleManager();


const HOMEDICS_DEVICE_NAME = 'Homedics';
const HOMEDICS_BROADCAST_NAME = 'HHBPA-100BT';
const HOMEDICS_COMMUNICATION_SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb';

const HOMEDICS_WRITE_CHARACTERISTIC = '0000fff5-0000-1000-8000-00805f9b34fb';
const HOMEDICS_READ_CHARACTERISTIC = '0000fff4-0000-1000-8000-00805f9b34fb';

export default function HomeScreen() {

  const [device, setDevice] = useState<Device | null>(null); 

  const scanForMonitors = useCallback(async () => {

    const onDeviceDiscovered = async (error: BleError, device: Device) => {  
      if (error) {
        // Handle error
        console.log('Scan error: ', error);
        return;
      }

      bleManager.stopDeviceScan();

      setDevice(device);
    };
    
    await bleManager.startDeviceScan([HOMEDICS_COMMUNICATION_SERVICE], null, onDeviceDiscovered);
  }, []);

  const connectToDevice = useCallback(async () => {
    if (device) {
      await device.connect();
      await device.discoverAllServicesAndCharacteristics();
      const charachteristics =  await device.characteristicsForService(HOMEDICS_COMMUNICATION_SERVICE);

      const writeCharacteristic = charachteristics?.find((c: Characteristic) => c.uuid === HOMEDICS_WRITE_CHARACTERISTIC);
      const readCharacteristic = charachteristics?.find((c: Characteristic) => c.uuid === HOMEDICS_READ_CHARACTERISTIC);


      // writeCharacteristic.writeWithResponse(base64js.fromByteArray(value))

    }
   }, [device]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Pair monitor</ThemedText>
        <Pressable style={{justifyContent: 'center', height: 50}} onPress={() => alert('Pressed!')}>
          <ThemedText type="link">Press to Pair monitor</ThemedText>
        </Pressable>
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
