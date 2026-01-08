import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

/* ---------- Reusable Input Component ---------- */
type InputProps = {
  label: string;
  value: string | undefined;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
};

function Input({ label, value, onChange, keyboardType = "default", onBlur }: InputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={styles.input}
        placeholder={label}
        onBlur={onBlur}
      />
    </View>
  );
}

export default function VehicleForm() {
  
  const router = useRouter();

  const [form, setForm] = useState({
    vehicle_name: "",
    vehicle_type: "",
    vehicle_class: "",
    owner_name: "",
    place: "",
    organization: "",
    department: "",
    current_meter_reading: "",
    permitted_liters: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const [vehicle_number, setvehicle_number] = useState<string>()
  const [vehicleNumber, setVehicleNumber] = useState<string | undefined>("");

  // const handleVehicleNumberBlur = () => {
  //   const formatted = formatVehicleNumber(vehicleNumber);
  //   const vehicle_number = formatted.toString()
  //   if (vehicle_number) {
  //     setForm({ ...form, vehicle_number: formatted });
  //     setVehicleNumber(null);
  //   } else {
  //     setVehicleNumber("Invalid vehicle number. Please enter in format XX-00-XX-0000.");
  //   }
  // };
  function formatVehicleNumber(vehicleNumber?: string ) {

    if (vehicleNumber !== undefined ){
      const clean = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      if (clean.length !== 10) {
        console.error("Invalid length");
        return Alert.alert("Vehicle Number should 10 characters");
      }
      setvehicle_number(clean.replace(/^([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{4})$/, "$1-$2-$3-$4"))

    }
  }

  const handleSubmit = async () => {

    try {
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          vehicle_number : vehicle_number,
          vehicle_name : form.vehicle_name,
          vehicle_class : form.vehicle_class,
          owner_name : form.owner_name,
          department : form.department,
          organization : form.organization,
          permitted_liters : form.permitted_liters,
          current_meter_reading : form.current_meter_reading,
          place : form.place
        });

      if (insertError) console.log(insertError);
     

      Alert.alert('Success', 'Vehicle added successfully!', [
          {
          text: 'OK',
          onPress: () => {
            router.replace('/dashboard'); 
          }}]
        )
      } catch{
        Alert.alert("Inserting of Data Failed")
      }

}

return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
     behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Vehicle</Text>

      <Text style={styles.label}>
        Vehicle Number
      </Text>
      <TextInput
        style={styles.input}
        value={vehicleNumber || undefined }
        onChangeText={setVehicleNumber }
        onBlur={() => formatVehicleNumber(vehicleNumber)}
      />
      <Input label="Vehicle Name" value={form.vehicle_name}
              onChange={(v) => handleChange('vehicle_name', v)} 
      />
      <Input label="Vehicle Type" value={form.vehicle_type}
              onChange={(v) => handleChange('vehicle_type', v)} 
      />
      <Input label="Vehicle Class" value={form.vehicle_class} 
              onChange={(v) => handleChange('vehicle_class', v)}
       />
      <Input label="Owner Name" value={form.owner_name} 
              onChange={(v) => handleChange('owner_name', v)}
      />
      <Input label="Place" value={form.place} 
              onChange={(v) => handleChange('place', v)}
      />
      <Input label="Organization" value={form.organization} 
              onChange={(v) => handleChange('organization', v)}
      />
      <Input label="Department" value={form.department} 
              onChange={(v) => handleChange('department', v)} 
      />

      <Input
        label="Current Meter Reading"
        value={form.current_meter_reading}
        onChange={(v) => handleChange("current_meter_reading", v)}
        keyboardType="numeric"
      />

      <Input
        label="Default Permitted Liters"
        value={form.permitted_liters}
        onChange={(v) => handleChange("permitted_liters", v)}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save Vehicle</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView/>
    </ScrollView>
  </KeyboardAvoidingView>
);
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#555",
    fontWeight : "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
})