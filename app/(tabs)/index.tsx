import { Image, StyleSheet, Platform, Pressable } from 'react-native';
import ByteBuffer from 'bytebuffer';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Buffer } from "buffer";
import base64js from 'base64-js';

let bleManager = new BleManager();


const HOMEDICS_DEVICE_NAME = 'Homedics';
const HOMEDICS_BROADCAST_NAME = 'HHBPA-100BT';
const HOMEDICS_COMMUNICATION_SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb';

const HOMEDICS_WRITE_CHARACTERISTIC = '0000fff5-0000-1000-8000-00805f9b34fb';
const HOMEDICS_READ_CHARACTERISTIC = '0000fff4-0000-1000-8000-00805f9b34fb';

export default function HomeScreen() {

  const writeCharacteristicRef = useRef<Characteristic | null>(null);
  const readCharacteristicRef = useRef<Characteristic | null>(null);

  const scanForMonitors = useCallback(async () => {

    console.log('Scanning for devices...');
    const onDeviceDiscovered = async (error: BleError, device: Device) => {  
      if (error) {
        // Handle error
        console.log('Scan error: ', error);
        return;
      }

      console.log('Stopping scan...'); 
      await bleManager.stopDeviceScan();
   
      try {
        const connectedDevice = await device.connect();
        await connectedDevice.discoverAllServicesAndCharacteristics();
    
        const characteristics = await connectedDevice.characteristicsForService(HOMEDICS_COMMUNICATION_SERVICE);
        console.log('found characteristics:', characteristics.length);
    
        writeCharacteristicRef.current = characteristics.find(
          (c: Characteristic) => c.uuid === HOMEDICS_WRITE_CHARACTERISTIC
        );
        readCharacteristicRef.current = characteristics.find(
          (c: Characteristic) => c.uuid === HOMEDICS_READ_CHARACTERISTIC
        );
    
        await queryMonitor(writeCharacteristicRef.current, readCharacteristicRef.current);
      } catch (error) {
        console.error('Error during device connection or communication:', error);
      }


    };
    
    await bleManager.startDeviceScan([HOMEDICS_COMMUNICATION_SERVICE], null, onDeviceDiscovered);
  }, []);

  const queryMonitor = useCallback(async (write: Characteristic, read: Characteristic) => {

    const queryData = ByteBuffer.allocate(4);
    queryData.writeInt8(0x6C, 0);
    queryData.writeInt8(0x80, 1);
    queryData.writeInt8(0x00, 2);
    queryData.writeInt8(0xEC, 3);
    
    console.log('Querying monitor...', queryData.view);
    
    try { 
      
      read.monitor((error, res: Characteristic) => {
        if (error) {
          console.log('Error monitoring characteristic: ', error);
          return;
        }
        const bytesList = Object.values(base64js.toByteArray(res.value))
        
        console.log('Query results are: ', bytesList);
      });
      
     await write.writeWithResponse(base64js.fromByteArray(queryData.view));
       
    }
    catch (error) {
      console.log('Error writing to device: ', error);
    } 

   },[]);

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
        <Pressable style={{justifyContent: 'center', height: 50}} onPress={() => scanForMonitors()}>
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
