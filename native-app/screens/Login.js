import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from "react-native";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const Login = ({ onLoginSuccess }) => {
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!gmail || !password) {
      Alert.alert("Error", "Enter gmail and password");
      return;
    }
    try {
      const q = query(collection(db, "users"), where("gmail", "==", gmail));
      const snapshot = await getDocs(q);
      let userDoc;
      if (snapshot.empty) {
        const docRef = await addDoc(collection(db, "users"), {
          gmail,
          password,
          shopId: "mainshop",
          shopName: "Main Shop",
          createdAt: new Date(),
        });
        userDoc = { id: docRef.id, gmail, shopId: "mainshop", shopName: "Main Shop" };
        Alert.alert("Success", "New User Created & Logged In ✅");
      } else {
        const existingUser = snapshot.docs[0].data();
        if (existingUser.password !== password) {
          Alert.alert("Error", "Wrong Password ❌");
          return;
        }
        userDoc = {
          id: snapshot.docs[0].id,
          gmail: existingUser.gmail,
          shopId: existingUser.shopId,
          shopName: existingUser.shopName,
        };
        Alert.alert("Success", "Login Successful ✅");
      }
      onLoginSuccess(userDoc);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🚜</Text>
          <Text style={styles.logoText}>Shah Agro</Text>
          <Text style={styles.tagline}>Advance Agriculture Management System</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your administrative account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@shahagro.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={gmail}
              onChangeText={setGmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Text>{showPassword ? "🙈" : "👁"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Sign In to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0c29",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 50,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
  },
  tagline: {
    color: "#a0aec0",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a202c",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4a5568",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f7fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  eyeIcon: {
    padding: 12,
  },
  loginBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Login;
