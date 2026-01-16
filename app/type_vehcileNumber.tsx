import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

function TypeVehicleNumber() {

  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter()

  function formatVehicleNumber(vehicleNumber?: string ) {

    if (vehicleNumber !== undefined ){
      const clean = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      if (clean.length !== 10) {
        console.error("Invalid length");
        return Alert.alert("Vehicle Number should 10 characters");
      }
      else {
      setVehicleNumber(clean.replace(/^([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{4})$/, "$1-$2-$3-$4"))
    }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Vehicle Number
      </Text>
     <TextInput
        placeholder="Vehicle Number"
        style={styles.input}
        value={vehicleNumber || undefined }
        onChangeText={setVehicleNumber }
        onBlur={() => formatVehicleNumber(vehicleNumber)}
      />
       <TouchableOpacity 
        style={styles.saveButton} 
        onPress={() => {
          console.log(vehicleNumber, "new veh at type page")
          router.navigate(`/qr-show?vehicle_number=${encodeURIComponent(vehicleNumber)}`)
        }}
      >
          <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container : {
    flex : 1,
    justifyContent : 'center',
    alignContent : 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#555",
    fontWeight : "bold",
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 40,
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
})
export default TypeVehicleNumber