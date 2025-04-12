import React, { useState, useEffect, useCallback ,useRef} from 'react';
import { SafeAreaView, FlatList, Text, View, TouchableOpacity, Alert, TextInput, Button ,StyleSheet,ScrollView, ActivityIndicator,Image,ImageBackground,Dimensions,Easing ,Modal} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { firebaseConfig,firestore ,auth,RecaptchaVerifier } from './firebaseConfig'; // Import Firestore from firebaseConfig
import { addDoc, collection, getDocs ,doc, setDoc, getDoc, updateDoc, arrayUnion ,onSnapshot,orderBy,query,where,serverTimestamp} from 'firebase/firestore'; // Import Firestore functions
import TimerDisplay from './TimerDisplay'; // Import the TimerDisplay component
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import parsePhoneNumberFromString from 'libphonenumber-js';
import {getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut ,signInWithPhoneNumber} from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const CustomFirebaseRecaptchaVerifierModal = ({
  firebaseConfig,
  attemptInvisibleVerification = false,
  ...props
}) => {
  return (
    <FirebaseRecaptchaVerifierModal
      firebaseConfig={firebaseConfig}
      attemptInvisibleVerification={attemptInvisibleVerification}
      {...props}
    />
  );
};

import Svg, { Path } from 'react-native-svg';
const Stack = createStackNavigator();

const isSafeSpot = (row, col) => {
  // Safe spots coordinates
  const safeSpots = [
      // Starting positions for each color
      [6, 1],    // Red start
      [1, 8],    // Green start
      [8, 13],   // Yellow start
      [13, 6],   // Blue start
      
      // Special safe spots
      [2, 6],    // Red safe spot
      [6, 12],   // Green safe spot
      [12, 8],   // Yellow safe spot
      [8, 2],    // Blue safe spot
  ];

  return safeSpots.some(([r, c]) => r === row && c === col);
};

// Add this after isSafeSpot function and before the components
const getCellColor = (row, col) => {
  // Home Areas
  // if (row <= 5 && col <= 5) return '#b43433';  // Red home (top-left)
  // if (row <= 5 && col >= 9) return '#31ad64';  // Green home (top-right)
  // if (row >= 9 && col >= 9) return '#e0c550';  // Yellow home (bottom-right)
  // if (row >= 9 && col <= 5) return '#4258c8';  // Blue home (bottom-left)

  // Safe spots (including starting positions)
  if (isSafeSpot(row, col)) {
      return '#222831';  // Safe spot color
  }

  // Home Paths
  // Red path
  if (row === 7 && col >= 1 && col <= 5) return 'transparent'; 
  if (row === 1 && col === 1) return 'white';
  if (row === 6 && col === 1) return 'transparent';             

  // Green path
  if (col === 7 && row >= 1 && row <= 5) return 'transparent';  
  if (row === 1 && col === 8) return 'transparent';             

  // Yellow path
  if (row === 7 && col >= 9 && col <= 13) return 'transparent';  
  if (row === 8 && col === 13) return 'transparent';             

  // Blue path
  if (col === 7 && row >= 9 && row <= 13) return 'transparent';  
  if (row === 13 && col === 6) return 'transparent';             

  // Center cell
  if (
    (row === 7 && col === 7) || (row === 6 && col === 7) || 
    (row === 6 && col === 6) || (row === 6 && col === 8) || 
    (row === 7 && col === 6) || (row === 7 && col === 8) || 
    (row === 8 && col === 6) || (row === 8 && col === 7) || 
    (row === 8 && col === 8)
  ) return 'transparent';  // Center color

  return 'transparent';  // Default cell color (white)
};



const tokenImages = {
  red: require('./assets/red pi.png'),
  yellow: require('./assets/yellow pi.png'),
  green: require('./assets/green pi.png'),
  blue: require('./assets/blue pi.png'),
};

// Token Component

function Token({ color, size = 30 }) {
  
  return (
    <View style={[styles.tokenContainer, { width: size, height: size,}]}>
      {/* Use Image if available */}
      {tokenImages[color] ? (
        <Image
          source={tokenImages[color]}
          style={{ width: size, height: size, resizeMode: 'cover' }}
        />
      ) : (
        // Fallback: simple colored circle
        <View
          style={{
            backgroundColor: color,
            width: size,
            height: size,

            borderColor: 'black',
          }}
        />
      )}
    </View>
  );
}


// Cell Component
function Cell({ position, tokens, onPress }) {
  const [row, col] = position;
  const isSafe = isSafeSpot(row, col);
  const cellColor = getCellColor(row, col);

  const getHomeStyle = () => {
      if (row <= 5 && col <= 5) return styles.redHome;   // Red home
      if (row <= 5 && col >= 9) return styles.greenHome; // Green home
      if (row >= 9 && col >= 9) return styles.yellowHome; // Yellow home
      if (row >= 9 && col <= 5) return styles.blueHome;  // Blue home
    

      if ((row === 2 && col === 1) || (row === 6 && col === 7) || (row === 6 && col === 6) || 
      (row === 6 && col === 8) || (row === 7 && col === 6) || (row === 7 && col === 8) || 
      (row === 8 && col === 6) || (row === 8 && col === 7) || (row === 8 && col === 8)) {
      return styles.centerCell;
  }

  return styles.defaultCell; // Default cell style

  };

  const arrangeTokens = () => {
      if (tokens.length > 1) {
          let tokenSize = tokens.length === 2 ? 8 : tokens.length === 3 ? 6 : 5;
          return (
              <View style={styles.multipleTokenContainer}>
                  {tokens.map((token, index) => (
                      <Token 
                          key={index} 
                          color={token.color} 
                          position={position}
                          size={tokenSize}
                      />
                  ))}
              </View>
          );
      }
      return tokens.map((token, index) => (
          <Token 
              key={index} 
              color={token.color} 
              position={position}
              size={30} 
          />
      ));
  };

  return (
      <TouchableOpacity 
          style={[
              styles.cell,
              cellColor && { backgroundColor: cellColor },
              isSafe && styles.safeSpot,
              getHomeStyle()
          ]}
          onPress={() => onPress(position)}
      >
          {arrangeTokens()}
      </TouchableOpacity>
  );
}


// Board Component
function Board({ currentPlayer, diceValue, tokens, onMoveToken, possibleMoves, onTokenSelect }) {
  const handleCellPress = (position) => {
      const hasToken = tokens.some(token => 
          token.position[0] === position[0] && 
          token.position[1] === position[1]
      );

      if (hasToken) {
          onTokenSelect(position);
      } else {
          onMoveToken(position);
      }
  };

  const renderBoard = () => {
      const board = [];
      for (let i = 0; i < 15; i++) {
          const row = [];
          for (let j = 0; j < 15; j++) {
              const currentTokens = tokens.filter(
                  token => token.position[0] === i && token.position[1] === j
              );
              const isHighlighted = possibleMoves.some(
                  move => move[0] === i && move[1] === j
              );

              row.push(
                  <Cell
                      key={`${i}-${j}`}
                      position={[i, j]}
                      tokens={currentTokens}
                      onPress={handleCellPress}
                      isHighlighted={isHighlighted}
                  />
              );
          }
          board.push(
              <View key={i} style={styles.row}>
                  {row}
              </View>
          );
      }
      return board;
  };

  return <View style={styles.board}>{renderBoard()}</View>;
}

const SignupScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [standards, setStandards] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const recaptchaVerifier = useRef(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(firestore, "countries"), orderBy("name")));
        setCountries(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching countries: ", error);
      }
    };
    fetchCountries();
  }, []);

  const handleCountrySelect = async (countryName) => {
    const country = countries.find(c => c.name === countryName);
    setSelectedCountry(country);
    setStates([]);
    setStandards([]);
    setSelectedState(null);
    setSelectedStandard(null);
    try {
      const statesRef = collection(firestore, "countries", country.name, "states");
      const stateSnapshot = await getDocs(query(statesRef, orderBy("name")));
      setStates(stateSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching states: ", error);
    }
  };

  const handleStateSelect = async (stateName) => {
    const state = states.find(s => s.name === stateName);
    setSelectedState(state);
    setStandards([]);
    setSelectedStandard(null);
    try {
      const standardsRef = collection(firestore, "countries", selectedCountry.name, "states", state.name, "standards");
      const querySnapshot = await getDocs(query(standardsRef, orderBy("name")));
      setStandards(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching standards: ", error);
    }
  };

  const handleSignup = async () => {
    if (!phoneNumber || !password || !confirmPassword || !selectedCountry || !selectedState || !selectedStandard) {
      Alert.alert("Error", "Please fill all fields correctly.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
      setConfirmResult(confirmation);
      setVerificationStep(true);
    } catch (error) {
      console.error("OTP Sending Error:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode) {
      Alert.alert("Error", "Please enter the verification code.");
      return;
    }
    if (!confirmResult) {
      Alert.alert("Error", "No verification session found. Please try signing up again.");
      return;
    }
    try {
      const userCredential = await confirmResult.confirm(verificationCode);
      const user = userCredential.user;
      
      // Save user data in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        phoneNumber: user.phoneNumber,
        country: selectedCountry.name,
        state: selectedState.name,
        standard: selectedStandard.name,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Account created successfully.");
      navigation.navigate("Login");
    } catch (error) {
      console.error("OTP Verification Error:", error);
      Alert.alert("Error", "Invalid verification code. Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={auth.app.options} />
      <ScrollView>
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>Signup</Text>

        {!verificationStep ? (
          <>
            <TextInput placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} style={{ borderBottomWidth: 1 }} />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderBottomWidth: 1 }} />
            <TextInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={{ borderBottomWidth: 1 }} />

            <Picker selectedValue={selectedCountry?.name} onValueChange={handleCountrySelect}>
              <Picker.Item label="Select Country" value={null} />
              {countries.map(country => <Picker.Item key={country.id} label={country.name} value={country.name} />)}
            </Picker>

            {selectedCountry && (
              <Picker selectedValue={selectedState?.name} onValueChange={handleStateSelect}>
                <Picker.Item label="Select State" value={null} />
                {states.map(state => <Picker.Item key={state.id} label={state.name} value={state.name} />)}
              </Picker>
            )}

            {selectedState && (
              <Picker selectedValue={selectedStandard?.name} onValueChange={(itemValue) => setSelectedStandard(standards.find(s => s.name === itemValue))}>
                <Picker.Item label="Select Standard" value={null} />
                {standards.map(standard => <Picker.Item key={standard.id} label={standard.name} value={standard.name} />)}
              </Picker>
            )}

            <TouchableOpacity onPress={handleSignup} style={{ backgroundColor: "blue", padding: 15, marginTop: 20, alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 18 }}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 15, alignItems: "center" }}>
              <Text style={{ color: "blue", fontSize: 16 }}>Already have an account? Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput placeholder="Enter OTP" value={verificationCode} onChangeText={setVerificationCode} style={{ borderBottomWidth: 1, marginTop: 20 }} />
            <TouchableOpacity onPress={handleVerifyOTP} style={{ backgroundColor: "green", padding: 15, marginTop: 20, alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 18 }}>Verify OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};



// Login Screen
const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const recaptchaVerifier = useRef(null);

  const handleLogin = async () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
      setConfirmResult(confirmation);
      setVerificationStep(true);
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

const handleVerifyOTP = async () => {
  if (!verificationCode) {
    Alert.alert("Error", "Please enter the verification code.");
    return;
  }
  try {
    const userCredential = await confirmResult.confirm(verificationCode);
    const user = userCredential.user;

    // Fetch user profile from Firestore
    const profileRef = collection(firestore, "users");
    const q = query(profileRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      Alert.alert("Profile Not Found", "User profile was not found. Please sign up.");
      return;
    }

    const profileData = querySnapshot.docs[0].data();

    // Navigate to ExamScreen with profile data
    navigation.navigate("Exam", {
      country: { name: profileData.country },
      state: { name: profileData.state },
      standard: { name: profileData.standard },
    });
  } catch (error) {
    Alert.alert("Error", "Invalid verification code.");
  }
};


  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={auth.app.options} />
      <ScrollView>
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>Login</Text>
        {!verificationStep ? (
          <>
            <TextInput placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} style={{ borderBottomWidth: 1 }} />
            <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: "blue", padding: 15, marginTop: 20, alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 18 }}>Send OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput placeholder="Enter OTP" value={verificationCode} onChangeText={setVerificationCode} style={{ borderBottomWidth: 1, marginTop: 20 }} />
            <TouchableOpacity onPress={handleVerifyOTP} style={{ backgroundColor: "green", padding: 15, marginTop: 20, alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 18 }}>Verify OTP</Text>
            </TouchableOpacity>
          </>
        )}
        {/* Switch to Signup */}
        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={{ color: "#007BFF", fontSize: 16, marginTop: 20 }}>
            Don't have an account? Signup
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};


const CountryStateScreen = ({ navigation }) => {
  const [countries, setCountries] = useState([]);
  const [newCountry, setNewCountry] = useState('');
  const [states, setStates] = useState([]);
  const [newState, setNewState] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [standards, setStandards] = useState([]);
  const [newStandard, setNewStandard] = useState('');

  // Fetch countries in alphabetical order, assign serial number based on index
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countriesRef = collection(firestore, 'countries');
        const q = query(countriesRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const countriesList = querySnapshot.docs.map((doc, index) => ({
          id: doc.id,
          countryNumber: index + 1,
          ...doc.data(),
        }));
        setCountries(countriesList);
      } catch (error) {
        console.error("Error fetching countries: ", error);
      }
    };
    fetchCountries();
  }, []);

  const handleAddCountry = async () => {
    if (!newCountry) {
      Alert.alert('Error', 'Please enter a country name.');
      return;
    }
    try {
      const countriesRef = collection(firestore, 'countries');
      // Get current count (ordered by name)
      const q = query(countriesRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const nextCountryNumber = snapshot.size + 1;
      await addDoc(countriesRef, { 
        name: newCountry, 
        countryNumber: nextCountryNumber 
      });
      setNewCountry('');
      Alert.alert('Success', `Country added successfully! (Country number: ${nextCountryNumber})`);
      // Refresh countries list
      const refreshedSnapshot = await getDocs(q);
      const countriesList = refreshedSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        countryNumber: index + 1,
        ...doc.data(),
      }));
      setCountries(countriesList);
    } catch (error) {
      console.error("Error adding country: ", error);
      Alert.alert('Error', 'There was an issue adding the country.');
    }
  };

  // Fetch states for selected country (ordered by name)
  const handleCountrySelect = async (country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setStandards([]);
    try {
      const statesRef = collection(firestore, 'countries', country.name, 'states');
      const q = query(statesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const statesList = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        stateNumber: index + 1,
        ...doc.data(),
      }));
      setStates(statesList);
    } catch (error) {
      console.error("Error fetching states: ", error);
    }
  };

  const handleAddState = async () => {
    if (!newState || !selectedCountry) {
      Alert.alert('Error', 'Please enter a state name.');
      return;
    }
    try {
      const statesRef = collection(firestore, 'countries', selectedCountry.name, 'states');
      const q = query(statesRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const nextStateNumber = snapshot.size + 1;
      await addDoc(statesRef, { 
        name: newState, 
        stateNumber: nextStateNumber 
      });
      setNewState('');
      Alert.alert('Success', `State added successfully! (State number: ${nextStateNumber})`);
      // Refresh states list
      const refreshedSnapshot = await getDocs(q);
      const statesList = refreshedSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        stateNumber: index + 1,
        ...doc.data(),
      }));
      setStates(statesList);
    } catch (error) {
      console.error("Error adding state: ", error);
      Alert.alert('Error', 'There was an issue adding the state.');
    }
  };

  // Fetch standards for selected state (ordered by name)
  const handleStateSelect = async (state) => {
    setSelectedState(state);
    try {
      const standardsRef = collection(firestore, 'countries', selectedCountry.name, 'states', state.name, 'standards');
      const q = query(standardsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const standardsList = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        standardNumber: index + 1,
        ...doc.data(),
      }));
      setStandards(standardsList);
    } catch (error) {
      console.error("Error fetching standards: ", error);
    }
  };

  const handleAddStandard = async () => {
    if (!newStandard || !selectedState) {
      Alert.alert('Error', 'Please enter a standard name.');
      return;
    }
    try {
      const standardsRef = collection(firestore, 'countries', selectedCountry.name, 'states', selectedState.name, 'standards');
      const q = query(standardsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const nextStandardNumber = snapshot.size + 1;
      await addDoc(standardsRef, { 
        name: newStandard, 
        standardNumber: nextStandardNumber 
      });
      setNewStandard('');
      Alert.alert('Success', `Standard added successfully! (Standard number: ${nextStandardNumber})`);
      // Refresh standards list
      const refreshedSnapshot = await getDocs(q);
      const standardsList = refreshedSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        standardNumber: index + 1,
        ...doc.data(),
      }));
      setStandards(standardsList);
    } catch (error) {
      console.error("Error adding standard: ", error);
      Alert.alert('Error', 'There was an issue adding the standard.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8ff' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Countries Section */}
        <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16, color: '#003366', textAlign: 'center' }}>
          Select a Country
        </Text>
        {countries.map((country) => (
          <TouchableOpacity
            key={country.id || country.name}
            onPress={() => handleCountrySelect(country)}
            style={{
              backgroundColor: '#007BFF',
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 16,
              marginBottom: 16,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
              {country.countryNumber}. {country.name}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
          <TextInput
            value={newCountry}
            placeholder="Add new country"
            onChangeText={setNewCountry}
            placeholderTextColor="#777"
            style={{
              flex: 1,
              backgroundColor: '#fff',
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#ccc',
              fontSize: 18,
              marginRight: 16,
            }}
          />
          <TouchableOpacity
            onPress={handleAddCountry}
            style={{
              backgroundColor: '#28A745',
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 16,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
              Add Country
            </Text>
          </TouchableOpacity>
        </View>

        {/* States Section */}
        {selectedCountry && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16, color: '#003366', textAlign: 'center' }}>
              Select a State in {selectedCountry.name}
            </Text>
            {states.map((state) => (
              <TouchableOpacity
                key={state.id || state.name}
                onPress={() => handleStateSelect(state)}
                style={{
                  backgroundColor: '#007BFF',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 5,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
                  {state.stateNumber}. {state.name}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
              <TextInput
                value={newState}
                placeholder="Add new state"
                onChangeText={setNewState}
                placeholderTextColor="#777"
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  fontSize: 18,
                  marginRight: 16,
                }}
              />
              <TouchableOpacity
                onPress={handleAddState}
                style={{
                  backgroundColor: '#28A745',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 5,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                  Add State
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Standards Section */}
        {selectedCountry && selectedState && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16, color: '#003366', textAlign: 'center' }}>
              Select a Standard in {selectedState.name}
            </Text>
            {standards.map((standard) => (
              <TouchableOpacity
                key={standard.id || standard.name}
                onPress={() =>
                  navigation.navigate('Exam', {
                    country: selectedCountry,
                    state: selectedState,
                    standard,
                  })
                }
                style={{
                  backgroundColor: '#007BFF',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 5,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
                  {standard.standardNumber ? `${standard.standardNumber}. ` : ''}{standard.name}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
              <TextInput
                value={newStandard}
                placeholder="Add new standard"
                onChangeText={setNewStandard}
                placeholderTextColor="#777"
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  fontSize: 18,
                  marginRight: 16,
                }}
              />
              <TouchableOpacity
                onPress={handleAddStandard}
                style={{
                  backgroundColor: '#28A745',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 5,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                  Add Standard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
const aspectRatio = 16 / 9;
const imageHeight = screenWidth / aspectRatio;

// Exam Screen
// const ExamScreen = ({ route, navigation }) => {
//   const { country, state, standard } = route.params;
//   const [exams, setExams] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredExams, setFilteredExams] = useState([]);

//   useEffect(() => { 
//     fetchExams();
//   }, [country, state, standard]);

//   const fetchExams = async () => {
//     try {
//       const examsRef = collection(
//         firestore,
//         'countries', country.name,
//         'states', state.name,
//         'standards', standard.name,
//         'exams'
//       );
//       const q = query(examsRef, orderBy('examNumber', 'asc'));
//       const querySnapshot = await getDocs(q);
//       const examsList = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         examNumber: doc.data().examNumber,
//         ...doc.data(),
//       }));
//       setExams(examsList);
//       setFilteredExams(examsList);
//     } catch (error) {
//       console.error("Error fetching exams: ", error);
//       Alert.alert("Error", "Failed to load exams.");
//     }
//   };

//   // (Optional) Filter exams based on searchQuery if needed.
//   useEffect(() => {
//     if (searchQuery.trim() === '') {
//       setFilteredExams(exams);
//     } else {
//       const lowerQuery = searchQuery.toLowerCase();
//       setFilteredExams(
//         exams.filter(item => item.name.toLowerCase().includes(lowerQuery))
//       );
//     }
//   }, [searchQuery, exams]);

//   const handleExamPress = (exam) => {
//     navigation.navigate('Paper', { country, state, standard, exam });
//   };

//   return (
//     <ImageBackground
//       source={require('./ui/photos/Untitled.png')}
//       style={{ width: screenWidth, height: screenHeight + 90 }}
//       resizeMode="cover"
//     >
//       {/* Dark overlay for contrast */}
//       <View style={{
//         position: 'absolute',
//         top: 0, left: 0, right: 0, bottom: 0,
//       }} />
//       <SafeAreaView style={{ flex: 1 }}>
//         {/* Profile Icon */}
//         <TouchableOpacity
//           onPress={() => navigation.navigate("Profile")}
//           style={{
//             position: 'absolute',
//             top: 10,
//             right: 20,
//             zIndex: 1,
//             width: 40,
//             height: 40,
//             borderRadius: 20,
//             backgroundColor: '#fff',
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}
//         >
//           <Image
//             source={require('./assets/blue-circle-with-white-user_78370-4707.avif')}
//             style={{ width: 30, height: 30, tintColor: '#007BFF' }}
//             resizeMode="contain"
//           />
//         </TouchableOpacity>

//         <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
//           <Text style={{
//             fontSize: 32,
//             fontWeight: '700',
//             textAlign: 'center',
//             marginBottom: 30,
//             color: '#fff',
//           }}>
//             📖 {state.name} Exams
//           </Text>
//           <Image 
//             source={require('./ui/photos/z7-removebg-preview.png')}
//             style={{ 
//               width: screenWidth, 
//               height: 120, 
//               marginLeft: -20, 
//               marginTop: 50, 
//               marginBottom: 20 
//             }}
//             resizeMode="cover"
//           />
//           {filteredExams.map((exam) => (
//             <TouchableOpacity
//               key={exam.id}
//               onPress={() => handleExamPress(exam)}
//               activeOpacity={0.8}
//               style={{ marginBottom: 15 }}
//             >
//               <ImageBackground
//                 source={require('./ui/photos/z2-removebg-preview.png')}
//                 style={{
//                   padding: 50,
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//                 resizeMode="cover"
//               >
//                 <Text style={{
//                   fontSize: 20,
//                   fontWeight: '700',
//                   color: '#fff',
//                   textShadowColor: '#000',
//                   textShadowOffset: { width: 1, height: 1 },
//                   textShadowRadius: 3,
//                   textAlign: 'center',
//                 }}>
//                   {exam.examNumber}. {exam.name} 
//                 </Text>
//               </ImageBackground>
//             </TouchableOpacity>
//           ))}
//           <Image 
//             source={require('./ui/photos/z8-removebg-preview.png')}
//             style={{ 
//               width: screenWidth, 
//               height: 110, 
//               marginLeft: -20, 
//               marginTop: 50, 
//               marginBottom: 20 
//             }}
//             resizeMode="cover"
//           />
//         </ScrollView>
//       </SafeAreaView>
//     </ImageBackground>
//   );
// };



const ExamScreen = ({ route, navigation }) => {
  const { country, state, standard } = route.params;
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);

  // Fetch exams from Firebase
  const fetchExams = async () => {
    try {
      const examsRef = collection(
        firestore,
        'countries', country.name,
        'states', state.name,
        'standards', standard.name,
        'exams'
      );
      const q = query(examsRef, orderBy('examNumber', 'asc'));
      const querySnapshot = await getDocs(q);
      const examsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        examNumber: doc.data().examNumber,
        ...doc.data(),
      }));
      setExams(examsList);
      setFilteredExams(examsList);
    } catch (error) {
      console.error("Error fetching exams: ", error);
      Alert.alert("Error", "Failed to load exams.");
    }
  };

  // Refresh exams when navigating back from ProfileScreen
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.refresh) {
        fetchExams();
      }
    }, [route.params?.refresh])
  );

  useEffect(() => {
    fetchExams();
  }, [country, state, standard]);

  const handleExamPress = (exam) => {
    navigation.navigate('Paper', { country, state, standard, exam });
  };

  return (
    <ImageBackground
      source={require('./ui/photos/Untitled.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Profile Icon */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={{
            position: 'absolute',
            top: 10,
            right: 20,
            zIndex: 1,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={require('./ui/photos/z8-removebg-preview.png')}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 30,
            color: '#fff',
          }}>
            📖 {state.name} Exams
          </Text>

          {filteredExams.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              onPress={() => handleExamPress(exam)}
              style={{ marginBottom: 15 }}
            >
              <View style={{
                padding: 20,
                backgroundColor: '#007BFF',
                borderRadius: 10,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>
                  {exam.examNumber}. {exam.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};



const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editing, setEditing] = useState(false); // Toggle edit mode

  // Lists for selection
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [standards, setStandards] = useState([]);

  // Editable selections
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState(null);

  const [updating, setUpdating] = useState(false);

  // Fetch the user's profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uid = auth.currentUser.uid;
        const profileRef = collection(firestore, 'users');
        const q = query(profileRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const profData = querySnapshot.docs[0].data();
          setProfile(profData);
          // Set default selections
          setSelectedCountry({ name: profData.country });
          setSelectedState({ name: profData.state });
          setSelectedStandard({ name: profData.standard });
        } else {
          Alert.alert("Profile not found", "Please sign up to create your profile.");
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch list of countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countriesRef = collection(firestore, 'countries');
        const q = query(countriesRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        setCountries(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    const fetchStates = async () => {
      if (!selectedCountry) return;
      try {
        const statesRef = collection(firestore, 'countries', selectedCountry.name, 'states');
        const q = query(statesRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        setStates(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, [selectedCountry]);

  // Fetch standards when state changes
  useEffect(() => {
    const fetchStandards = async () => {
      if (!selectedCountry || !selectedState) return;
      try {
        const standardsRef = collection(firestore, 'countries', selectedCountry.name, 'states', selectedState.name, 'standards');
        const q = query(standardsRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        setStandards(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching standards:', error);
      }
    };
    fetchStandards();
  }, [selectedState]);

  // Update profile
  const updateProfile = async () => {
    setUpdating(true);
    try {
      const uid = auth.currentUser.uid;
      const profileRef = collection(firestore, 'users');
      const q = query(profileRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Alert.alert("Error", "Profile not found.");
        setUpdating(false);
        return;
      }
      const docId = querySnapshot.docs[0].id;
      await updateDoc(doc(firestore, 'users', docId), {
        country: selectedCountry.name,
        state: selectedState.name,
        standard: selectedStandard.name,
      });
      Alert.alert("Success", "Profile updated.");
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  if (loadingProfile) {
    return <ActivityIndicator size="large" color="#007BFF" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  if (!profile) {
    return <Text style={{ textAlign: 'center', marginTop: 50 }}>Profile not found. Please sign up.</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>My Profile</Text>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Email: {profile.email}</Text>

        {!editing ? (
          <>
            <Text style={{ fontSize: 18 }}>Country: {profile.country}</Text>
            <Text style={{ fontSize: 18 }}>State: {profile.state}</Text>
            <Text style={{ fontSize: 18 }}>Standard: {profile.standard}</Text>

            <TouchableOpacity onPress={() => setEditing(true)} style={{ marginTop: 20, backgroundColor: '#007BFF', padding: 15, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 18 }}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Select Country</Text>
            {countries.map(c => (
              <TouchableOpacity key={c.id} onPress={() => setSelectedCountry({ name: c.name })} style={{ padding: 10, backgroundColor: selectedCountry.name === c.name ? '#007BFF' : '#fff', marginVertical: 5, width: '100%', borderRadius: 5 }}>
                <Text style={{ fontSize: 18 }}>{c.name}</Text>
              </TouchableOpacity>
            ))}

            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Select State</Text>
            {states.map(s => (
              <TouchableOpacity key={s.id} onPress={() => setSelectedState({ name: s.name })} style={{ padding: 10, backgroundColor: selectedState.name === s.name ? '#007BFF' : '#fff', marginVertical: 5, width: '100%', borderRadius: 5 }}>
                <Text style={{ fontSize: 18 }}>{s.name}</Text>
              </TouchableOpacity>
            ))}

            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Select Standard</Text>
            {standards.map(std => (
              <TouchableOpacity key={std.id} onPress={() => setSelectedStandard({ name: std.name })} style={{ padding: 10, backgroundColor: selectedStandard.name === std.name ? '#007BFF' : '#fff', marginVertical: 5, width: '100%', borderRadius: 5 }}>
                <Text style={{ fontSize: 18 }}>{std.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={updateProfile} style={{ marginTop: 20, backgroundColor: '#28a745', padding: 15, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 18 }}>{updating ? "Updating..." : "Save Changes"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditing(false)} style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 16, color: 'red' }}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const PaperScreen = ({ route, navigation }) => {
  const { country, state, standard, exam } = route.params;
  const [papers, setPapers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPapers, setFilteredPapers] = useState([]);

  // Realtime Firestore listener for papers.
  useEffect(() => {
    const papersRef = collection(
      firestore,
      'countries', country.name,
      'states', state.name,
      'standards', standard.name,
      'exams', exam.name,
      'papers'
    );
    const q = query(papersRef, orderBy('paperNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const papersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        paperNumber: doc.data().paperNumber,
        ...doc.data(),
      }));
      setPapers(papersList);
      setFilteredPapers(papersList);
    }, (error) => {
      console.error("Error fetching papers: ", error);
      Alert.alert("Error", "Failed to load papers.");
    });
    return () => unsubscribe();
  }, [country, state, standard, exam]);

  // Optionally filter papers based on a search query.
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPapers(papers);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredPapers(
        papers.filter(item => item.name.toLowerCase().includes(lowerQuery))
      );
    }
  }, [searchQuery, papers]);

  const handlePaperPress = (paper) => {
    navigation.navigate('Subject', { country, state, standard, exam, paper });
  };

  return (
    <ImageBackground
      source={require('./ui/photos/t1-removebg-preview.png')} // Ludo-themed background image
      style={{ flex: 1, width: screenWidth, height: screenHeight + 90, marginTop: -20 }}
      resizeMode="cover"
    >
      {/* Dark overlay for contrast */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
      }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <GradientText
            text={`${exam.name} - Papers`}
            style={{
              fontSize: 32,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 30,
              color: '#fff'
            }}
          />
          <Image 
            source={require('./ui/photos/s6-removebg-preview.png')}
            style={{ width: screenWidth, height: 110, marginLeft: -20, marginTop: 50, marginBottom: 20 }}
            resizeMode="cover"
          />
          {/* Ludo-inspired paper buttons */}
          {filteredPapers.map((paper) => (
            <TouchableOpacity
              key={paper.id}
              onPress={() => handlePaperPress(paper)}
              activeOpacity={0.8}
              style={{ marginBottom: 15 }}
            >
              <ImageBackground
                source={require('./ui/photos/t2-removebg-preview.png')} // Pattern image for paper buttons
                style={{
                  padding: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  height:180,
                }}
                resizeMode="cover"
              >
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#fff',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3,
                  textAlign: 'center',
                }}>
                   {paper.paperNumber}. {paper.name} 
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          ))}
          <Image 
            source={require('./ui/photos/t3-removebg-preview.png')}
            style={{ width: screenWidth, height: 190, marginLeft: -20, marginTop: 50, marginBottom: 20 }}
            resizeMode="cover"
          />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

// Subject Screen
const GradientText = ({ text, style, gradientColors = ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#8B00FF'] }) => (
  <MaskedView
    style={{ flexDirection: 'row' }}
    maskElement={
      <Text style={[style, { backgroundColor: 'transparent' }]}>
        {text}
      </Text>
    }
  >
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ flex: 1 }}
    />
  </MaskedView>
);

const SubjectScreen = ({ route, navigation }) => {
  const { country, state, standard, exam, paper } = route.params;
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  // Realtime Firestore listener for subjects
  useEffect(() => {
    const subjectsRef = collection(
      firestore,
      'countries', country.name,
      'states', state.name,
      'standards', standard.name,
      'exams', exam.name,
      'papers', paper.name,
      'subjects'
    );
    const q = query(subjectsRef, orderBy('subjectNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        subjectNumber: doc.data().subjectNumber,
        ...doc.data(),
      }));
      setSubjects(subjectsList);
      setFilteredSubjects(subjectsList);
    }, (error) => {
      console.error("Error fetching subjects: ", error);
    });
    return () => unsubscribe();
  }, [country, state, standard, exam, paper]);

  // Filter subjects as search query changes.
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubjects(subjects);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredSubjects(
        subjects.filter(item => item.name.toLowerCase().includes(lowerQuery))
      );
    }
  }, [searchQuery, subjects]);

  const handleAddSubject = async () => {
    if (!newSubject) {
      Alert.alert('Error', 'Please enter a subject name.');
      return;
    }
    try {
      const subjectsRef = collection(
        firestore,
        'countries', country.name,
        'states', state.name,
        'standards', standard.name,
        'exams', exam.name,
        'papers', paper.name,
        'subjects'
      );
      const q = query(subjectsRef, orderBy('subjectNumber', 'asc'));
      const snapshot = await getDocs(q);
      const nextSubjectNumber = snapshot.size + 1;
      await addDoc(subjectsRef, { 
        name: newSubject, 
        subjectNumber: nextSubjectNumber 
      });
      setNewSubject('');
      Alert.alert('Success', `Subject added successfully! (Subject number: ${nextSubjectNumber})`);
    } catch (error) {
      console.error("Error adding subject: ", error);
      Alert.alert('Error', 'There was an issue adding the subject.');
    }
  };

  const handleSubjectPress = (subject) => {
    navigation.navigate('Chapter', { country, state, standard, exam, paper, subject });
  };

  return (
    <ImageBackground
      source={require('./ui/photos/s5-removebg-preview.png')} // Replace with your Ludo-themed background image path
      style={{ flex: 1, width:screenWidth ,height: screenHeight+90,marginTop:-20}}
      
    >
      {/* Dark overlay for contrast */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        
      }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <GradientText
            text={`${paper.name} - Subjects`}
            style={{ fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 30, color: '#fff' }}
          />
          {/* Search Bar */}
          <Image 
        source={require('./ui/photos/s1-removebg-preview.png')}
        style={{ width: screenWidth, height: 110 , marginLeft:-20,marginTop:50,marginBottom: 20}}
        resizeMode="cover"
      />
          {/* Ludo-Inspired Subject Buttons */}
          {filteredSubjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              onPress={() => handleSubjectPress(subject)}
              activeOpacity={0.8}
              style={{

              }}
            >
              <ImageBackground
                source={require('./ui/photos/s4-removebg-preview.png')} // Replace with your pattern image
                style={{
                  padding: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                
              >

                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#fff',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3,
                  textAlign: 'center',
                }}>
                  {subject.subjectNumber}. {subject.name}
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          ))}
          <Image 
        source={require('./ui/photos/s3-removebg-preview1.png')}
        style={{ width: screenWidth, height: 110 , marginLeft:-20,marginTop:50,marginBottom: 20}}
        resizeMode="cover"
      />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const { width, height } = Dimensions.get('window');

const ChapterScreen = ({ route, navigation }) => {
  const { country, state, standard, exam, paper, subject } = route.params;
  const [chapters, setChapters] = useState([]);
  const [newChapter, setNewChapter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChapters, setFilteredChapters] = useState([]);

  // Realtime Firestore listener for chapters.
  useEffect(() => {
    const chaptersRef = collection(
      firestore,
      'countries', country.name,
      'states', state.name,
      'standards', standard.name,
      'exams', exam.name,
      'papers', paper.name,
      'subjects', subject.name,
      'chapters'
    );
    const q = query(chaptersRef, orderBy('chapterNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chaptersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        chapterNumber: doc.data().chapterNumber,
        ...doc.data(),
      }));
      setChapters(chaptersList);
      setFilteredChapters(chaptersList);
    }, (error) => {
      console.error("Error fetching chapters: ", error);
      Alert.alert("Error", "Failed to load chapters.");
    });
    return () => unsubscribe();
  }, [country, state, standard, exam, paper, subject]);

  // Filter chapters as search query changes.
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChapters(chapters);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredChapters(
        chapters.filter(item => item.name.toLowerCase().includes(lowerQuery))
      );
    }
  }, [searchQuery, chapters]);

  const handleAddChapter = async () => {
    if (!newChapter) {
      Alert.alert('Error', 'Please enter a chapter name.');
      return;
    }
    try {
      const chaptersRef = collection(
        firestore,
        'countries', country.name,
        'states', state.name,
        'standards', standard.name,
        'exams', exam.name,
        'papers', paper.name,
        'subjects', subject.name,
        'chapters'
      );
      const q = query(chaptersRef, orderBy('chapterNumber', 'asc'));
      const snapshot = await getDocs(q);
      const nextChapterNumber = snapshot.size + 1;
      await addDoc(chaptersRef, { name: newChapter, chapterNumber: nextChapterNumber });
      setNewChapter('');
      Alert.alert('Success', 'Chapter added successfully!');
    } catch (error) {
      console.error("Error adding chapter: ", error);
      Alert.alert('Error', 'There was an issue adding the chapter.');
    }
  };

  const handleChapterPress = (chapter) => {
    navigation.navigate('Create or Join Room', { country, state, standard, exam, paper, subject, chapter });
  };

  return (
    <ImageBackground
      source={require('./ui/photos/r1-removebg-preview.png')} // Ludo-themed background image
      style={{ flex: 1, width: screenWidth, height: screenHeight + 90, marginTop: -20 }}
      resizeMode="cover"
    >
      {/* Dark overlay for contrast */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        
      }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <GradientText
            text={`${subject.name} - Chapters`}
            style={{
              fontSize: 32,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 30,
              color: '#fff',
            }}
          />
          {/* Search Bar */}
          <Image 
        source={require('./ui/photos/p2-removebg-preview.png')}
        style={{ width: screenWidth, height: 110 , marginLeft:-20,marginTop:50,marginBottom: 20}}
        resizeMode="cover"
      />
          {/* Chapter Buttons */}
          {filteredChapters.map((chapter) => (
            <TouchableOpacity
              key={chapter.id}
              onPress={() => handleChapterPress(chapter)}
              activeOpacity={0.8}
              style={{ marginBottom: 15 }}
            >
              <ImageBackground
                source={require('./ui/photos/p3-removebg-preview.png')} // Pattern image for chapter buttons
                style={{
                  padding: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                resizeMode="cover"
              >
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#fff',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3,
                  textAlign: 'center',
                }}>
                  {chapter.chapterNumber}. {chapter.name}
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          ))}
         <Image 
        source={require('./ui/photos/c1-removebg-preview.png')}
        style={{ width: screenWidth, height: 110 , marginLeft:-20,marginTop:50,marginBottom: 20}}
        resizeMode="cover"
      />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};






  const CreateOrJoinRoomScreen = ({ route, navigation }) => {
    const { country, state, standard, exam, paper, subject, chapter } = route.params;
    const [roomID, setRoomID] = useState('');
    const [roomCreated, setRoomCreated] = useState(false);
    const [roomNotFound, setRoomNotFound] = useState(false);
    const [playerName, setPlayerName] = useState('');
  
    const createRoom = async () => {
      if (!playerName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
  
      const newRoomID = generateRoomID();
      const roomRef = doc(firestore, 'rooms', newRoomID);
  
      try {
        const mcqsRef = collection(firestore, 'countries', country.name, 'states', state.name, 'standards', standard.name,
          'exams', exam.name, 'papers', paper.name, 'subjects', subject.name, 'chapters', chapter.name, 'mcqs');
        const mcqsSnapshot = await getDocs(mcqsRef);
        const mcqsList = mcqsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        await setDoc(roomRef, {
          players: [{ id: 'player1', name: playerName }],
          playerLimit: 1,
          currentIndex: 0,
          currentTurn: 'player1',
          mcqs: mcqsList,
          scores: {},
          gameStarted: true,
          lastAnsweredBy: null
        });
  
        setRoomID(newRoomID);
        setRoomCreated(true);
  
        navigation.navigate('Ludo', { mcqsRef });
      } catch (error) {
        console.error("Error creating room: ", error);
        Alert.alert('Error', 'There was an issue creating the room.');
      }
    };
  
    const generateRoomID = () => {
      return Math.random().toString(36).substr(2, 6);
    };
  
    const joinRoom = async () => {
      if (!playerName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
  
      const roomRef = doc(firestore, 'rooms', roomID);
      const roomSnap = await getDoc(roomRef);
  
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const playerCount = roomData.players.length;
        const newPlayerId = `player${playerCount + 1}`;
  
        const newPlayer = { id: newPlayerId, name: playerName };
        await updateDoc(roomRef, {
          players: arrayUnion(newPlayer),
        });
  
        navigation.navigate('MCQ', { 
          country, 
          state, 
          standard,
          exam, 
          paper, 
          subject, 
          roomID,
          playerName
        });
      } else {
        setRoomNotFound(true);
      }
    };
  
    return (
      <ImageBackground
      source={require('./assets/AAA style background for Ludo game.png')} // Replace with your image path
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#00E5FF', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2 }}>
          Select your language
        </Text>
  
        <TextInput
          placeholder="Enter your name"
          placeholderTextColor="#8B949E"
          value={playerName}
          onChangeText={setPlayerName}
          style={{ 
            backgroundColor: '#1A1F2E', 
            color: '#C9D1D9', 
            padding: 18, 
            borderRadius: 20, 
            borderWidth: 3, 
            borderColor: '#00E5FF', 
            marginBottom: 20,
            fontSize: 20,
            width: '90%',
            textAlign: 'center',
            shadowColor: '#00E5FF',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 1,
            shadowRadius: 15,
            elevation: 15,
            textTransform: 'uppercase',
            letterSpacing: 1.8,
            fontWeight: 'bold'
          }}
        />
  
        <TouchableOpacity
          onPress={createRoom}
          style={{
            paddingVertical: 18,
            paddingHorizontal: 30,
            backgroundColor: '#00E5FF',
            borderRadius: 20,
            alignItems: 'center',
            width: '90%',
            shadowColor: '#00E5FF',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 20,
            borderWidth: 3,
            borderColor: '#FFFFFF',
            transform: [{ scale: 1 }],
            transition: 'transform 0.1s ease-in-out'
          }}
        >
          <Text style={{ color: '#0A0F1E', fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2.5 }}>
            Start Single Player
          </Text>
        </TouchableOpacity>
  
        {roomCreated && <Text style={{ color: '#00E5FF', textAlign: 'center', marginTop: 15, fontSize: 18, fontWeight: 'bold' }}>Room ID: {roomID}</Text>}
        {roomNotFound && <Text style={{ color: 'red', textAlign: 'center', marginTop: 15, fontSize: 18, fontWeight: 'bold' }}>Room not found. Please check the ID.</Text>}
      </SafeAreaView>
      </ImageBackground>
    );
  };
 
// MCQ Screen
const MCQScreen = ({ route, navigation }) => {
  const { roomID, playerName } = route.params;
  
  const [mcqs, setMcqs] = useState([]);
  const [currentMCQ, setCurrentMCQ] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentTurn, setCurrentTurn] = useState('');
  const [players, setPlayers] = useState([]);
  const [playerRole, setPlayerRole] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [scores, setScores] = useState({});

  useEffect(() => {
    const roomRef = doc(firestore, 'rooms', roomID);
    
    const unsubscribe = onSnapshot(roomRef, (roomSnap) => {
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        setPlayers(roomData.players);
        setMcqs(roomData.mcqs || []);
        setCurrentMCQ(roomData.mcqs[roomData.currentIndex]);
        setCurrentTurn(roomData.currentTurn);
        setScores(roomData.scores || {});
        
        // Determine player role based on player ID
        const player = roomData.players.find(p => p.name === playerName);
        if (player) {
          setPlayerRole(player.id);
        }

        setGameStarted(roomData.players.length >= roomData.playerLimit);
      }
    });

    return () => unsubscribe();
  }, [roomID, playerName]);

  const getNextPlayerId = (currentPlayerId, players) => {
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex].id;
  };

  const handleAnswer = async (selectedAnswer) => {
    if (!userAnswer) {
      Alert.alert('Error', 'Please select an answer.');
      return;
    }

    const roomRef = doc(firestore, 'rooms', roomID);

    try {
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data();
      
      // Update scores
      const newScores = { ...roomData.scores } || {};
      const isCorrect = selectedAnswer === currentMCQ.correctAnswer;
      newScores[playerRole] = (newScores[playerRole] || 0) + (isCorrect ? 1 : 0);

      // Find next player
      const nextPlayerId = getNextPlayerId(playerRole, roomData.players);
      
      // Check if we've completed a full round
      const isFullRound = nextPlayerId === roomData.players[0].id;
      let nextIndex = roomData.currentIndex;

      if (isFullRound) {
        // Move to next question when all players have answered
        nextIndex = roomData.currentIndex + 1;
        // Reset to first question if we've reached the end
        if (nextIndex >= roomData.mcqs.length) {
          nextIndex = 0;
        }
      }

      // Update room state
      await updateDoc(roomRef, {
        currentTurn: nextPlayerId,
        currentIndex: nextIndex,
        scores: newScores,
        lastAnsweredBy: playerRole
      });

      setUserAnswer('');

      // Show feedback for answer
      Alert.alert(
        isCorrect ? 'Correct!' : 'Incorrect',
        `The correct answer was: ${currentMCQ.correctAnswer}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error updating answer:', error);
      Alert.alert('Error', 'Failed to submit answer');
    }
  };

  // Render waiting screen if game hasn't started
  if (!gameStarted) {
    return (
      <SafeAreaView style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center' }}>
          Waiting for players to join...
        </Text>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Players in game:</Text>
          {players.map((player, index) => (
            <Text key={index} style={{ padding: 5 }}>
              {player.name} {player.name === playerName ? '(You)' : ''}
            </Text>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ padding: 20 }}>
      {/* Players and Scores Section */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Players:</Text>
        {players.map((player, index) => (
          <View key={index} style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            padding: 5,
            backgroundColor: player.id === currentTurn ? '#e0e0e0' : 'transparent',
            borderRadius: 5
          }}>
            <Text>
              {player.name} {player.name === playerName ? '(You)' : ''}
              {player.id === currentTurn ? ' 🎯' : ''}
            </Text>
            <Text>Score: {scores[player.id] || 0}</Text>
          </View>
        ))}
      </View>

      {/* MCQ Section - Only show to current player */}
      {currentMCQ && currentTurn === playerRole ? (
        <View>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            Question {mcqs.indexOf(currentMCQ) + 1} of {mcqs.length}
          </Text>
          <View style={styles.mcqContainer}>
            {currentMCQ && (
                <>
                    <Text style={styles.questionText}>{currentMCQ.question}</Text>
                    {currentMCQ.options.map((option, index) => {
                        const isSelected = selectedAnswerState.selected === option;
                        const isCorrect = option === currentMCQ.correctOption;
                        const backgroundColor = isSelected
                            ? (isCorrect ? styles.correctAnswer.backgroundColor : styles.incorrectAnswer.backgroundColor)
                            : 'transparent';

                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.answerOption, { backgroundColor }]}
                                onPress={() => handleMCQAnswerSelection(option)}
                                disabled={selectedAnswerState.showFeedback}
                            >
                                <Text style={[
                                    styles.answerText,
                                    isCorrect && { fontWeight: 'bold' }
                                ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    {diceValue !== null && (
                        <Text>You rolled: {diceValue}</Text> // Ensure this is wrapped in <Text>
                    )}
                </>
            )}
          </View>
          <Button 
            title="Submit Answer" 
            onPress={() => handleAnswer(userAnswer)}
            disabled={!userAnswer}
          />
          <Ludo/>
        </View>
      ) : (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, textAlign: 'center' }}>
            {players.find(p => p.id === currentTurn)?.name}'s turn
          </Text>
          <Text style={{ marginTop: 10, textAlign: 'center' }}>
            Please wait for your turn...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};


const Ludo=({ route }) => {
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [diceValue, setDiceValue] = useState(null);
    const [tokens, setTokens] = useState([
        // Red tokens
        { id: 'red1', color: 'red', position: [1, 1], isHome: true },
        { id: 'red2', color: 'red', position: [1, 4], isHome: true },
        { id: 'red3', color: 'red', position: [4, 1], isHome: true },
        { id: 'red4', color: 'red', position: [4, 4], isHome: true },
        // Green tokens
        { id: 'green1', color: 'green', position: [1, 10], isHome: true },
        { id: 'green2', color: 'green', position: [1, 13], isHome: true },
        { id: 'green3', color: 'green', position: [4, 10], isHome: true },
        { id: 'green4', color: 'green', position: [4, 13], isHome: true },
        // Yellow tokens
        { id: 'yellow1', color: 'yellow', position: [10, 10], isHome: true },
        { id: 'yellow2', color: 'yellow', position: [10, 13], isHome: true },
        { id: 'yellow3', color: 'yellow', position: [13, 10], isHome: true },
        { id: 'yellow4', color: 'yellow', position: [13, 13], isHome: true },
        // Blue tokens
        { id: 'blue1', color: 'blue', position: [10, 1], isHome: true },
        { id: 'blue2', color: 'blue', position: [10, 4], isHome: true },
        { id: 'blue3', color: 'blue', position: [13, 1], isHome: true },
        { id: 'blue4', color: 'blue', position: [13, 4], isHome: true },
    ]);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [showTokenSelection, setShowTokenSelection] = useState(false);
    const [stackedTokens, setStackedTokens] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [winners, setWinners] = useState([]);
    const [gameEnded, setGameEnded] = useState(false);
    const [redTokensCompleted, setRedTokensCompleted] = useState(0);
    const [greenTokensCompleted, setGreenTokensCompleted] = useState(0);
    const [yellowTokensCompleted, setYellowTokensCompleted] = useState(0);
    const [blueTokensCompleted, setBlueTokensCompleted] = useState(0);
    const [showPlayerSelection, setShowPlayerSelection] = useState(true);
    const [numberOfPlayers, setNumberOfPlayers] = useState(null);
    const [activeColors, setActiveColors] = useState([]);
    const [flashMessage, setFlashMessage] = useState("");
    const [showFlash, setShowFlash] = useState(false);
    const [gameMode, setGameMode] = useState('human'); // 'human' or 'computer'
    const [computerPlayers, setComputerPlayers] = useState([]);
    const [isComputerTurn, setIsComputerTurn] = useState(false);
    const [isDiceEnabled, setIsDiceEnabled] = useState(true);
    const [mcqData, setMcqData] = useState(null);
    const [mcqResponse, setMcqResponse] = useState(null);


    const { mcqsRef } = route.params; // Get the reference to MCQs from route params
    const [mcqs, setMcqs] = useState([]); // State for MCQs
    const [currentMCQ, setCurrentMCQ] = useState(null); // State for the current MCQ
    const [userAnswer, setUserAnswer] = useState(''); // State for user's answer
    const [currentTurn, setCurrentTurn] = useState(''); // State for current player's turn
    const [players, setPlayers] = useState([]); // State for players
    const [playerRole, setPlayerRole] = useState(''); // State for player's role
    const [gameStarted, setGameStarted] = useState(false); // State for game status
    const [scores, setScores] = useState({}); // State for scores

    const [isMCQVisible, setIsMCQVisible] = useState(true);
    const [startTime, setStartTime] = useState(null); // Ensure this is defined
    const [timeTaken, setTimeTaken] = useState(0);
    const [feedbackColor, setFeedbackColor] = useState(''); // Initialize with an empty string or a default color
    const [isTimerVisible, setIsTimerVisible] = useState(false);
    const [lastCapture, setLastCapture] = useState(null);

    const [selectedAnswerState, setSelectedAnswerState] = useState({
      selected: null,
      isCorrect: null,
      showFeedback: false
    });
    

    // Add turn observer state
    const [turnState, setTurnState] = useState({
        isComputerTurn: false,
        isDiceRollAllowed: true,
        lastRoll: null
    });

    const playerColors = {
        2: ['red', 'green'],
        3: ['red', 'green', 'yellow'],
        4: ['red', 'green', 'yellow', 'blue']
    };
    const startPositions = {
        red: [6, 1],    // Red starting position
        green: [1, 8],  // Green starting position
        yellow: [8, 13], // Yellow starting position
        blue: [13, 6]   // Blue starting position
    };

    const playerPaths = {
        red: [
            // Start position
            [6, 1],
            // Move right to center column
            [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6],
            // Down center column
            [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8], [1, 8],
            // Move right across bottom
            [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10],
            // Up right side
            [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
            // Move left across top
            [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
            // Home stretch (red)
            [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
            [14, 7], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
            [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
            [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]
        ],

        green: [
            // Start position
            [1, 8],
            // Move down center column
            [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10],
            // Right across middle
            [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
            // Down right side
            [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8],
            // Move left across bottom
            [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7],
            // Up center column
            [14, 6], [13, 6], [12, 6], [11, 6], [10, 6],[9,6],
            // Home stretch (green)
            [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
            [7, 0], [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
            [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
            [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]
        ],

        yellow: [
            // Start position
            [8, 13],
            // Move left to center column
            [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8],
            // Up center column
            [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6], [13, 6],
            // Move left across top
            [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4],
            // Down left side
            [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
            // Right across bottom
            [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
            // Home stretch (yellow)
            [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
            [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
            [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
            [7, 14], [7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]
        ],

        blue: [
            // Start position
            [13, 6],
            // Move up center column
            [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4],
            // Left across middle
            [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
            // Up left side
            [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6],
            // Move right across top
            [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
            // Down center column
            [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
            // Home stretch (blue)
            [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
            [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
            [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
            [14, 7], [13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]
        ]
    };

    const calculatePossibleMoves = (token, diceValue) => {
        if (!token || diceValue === null) return [];

        const currentColor = playerColors[numberOfPlayers][currentPlayer];
        const currentPath = playerPaths[currentColor];
        
        // Find the token object
        const tokenObj = tokens.find(t => 
            t.position[0] === token[0] && 
            t.position[1] === token[1] && 
            t.color === currentColor
        );

        // If token is in home area
        if (tokenObj && tokenObj.isHome) {
            // Can only move out with a 6
            if (diceValue === 6) {
                return [startPositions[currentColor]];
            }
            return []; // No moves possible if not 6
        }

        // For tokens already in play
        const currentIndex = currentPath.findIndex(([row, col]) => 
            row === token[0] && col === token[1]
        );

        if (currentIndex === -1) return [];

        const targetIndex = currentIndex + diceValue;
        if (targetIndex >= currentPath.length) return [];

        return [currentPath[targetIndex]];
    };

    const winningPositions = {
        red: [7, 6],      // Red's final position
        green: [6, 7],    // Green's final position
        yellow: [7, 8],   // Yellow's final position
        blue: [8, 7]      // Blue's final position
    };

    // Add this function to check if a token is in its winning position
    const isTokenInWinPosition = (token) => {
        const [row, col] = token.position;
        switch(token.color) {
            case 'red':
                return row === 7 && col === 6;
            case 'green':
                return row === 6 && col === 7;
            case 'yellow':
                return row === 7 && col === 8;
            case 'blue':
                return row === 8 && col === 7;
            default:
                return false;
        }
    };

    // Add this function to check if all tokens of a color are in winning position
    const checkAllTokensComplete = (color, tokens) => {
        const colorTokens = tokens.filter(t => t.color === color);
        return colorTokens.every(token => isTokenInWinPosition(token));
    };

    // Helper function to check if a player has completed all tokens
    const isPlayerCompleted = (color) => {
        if (!color) return false;
        
        const completedCounts = {
            'red': redTokensCompleted,
            'green': greenTokensCompleted,
            'yellow': yellowTokensCompleted,
            'blue': blueTokensCompleted
        };
        return completedCounts[color] === 4;
    };

    // Helper function to get next active player
    const getNextActivePlayer = (currentIndex) => {
        let nextIndex = (currentIndex + 1) % numberOfPlayers;
        let attempts = 0;
        
        // Loop until we find an active player or we've checked all players
        while (attempts < numberOfPlayers) {
            const nextColor = activeColors[nextIndex];
            if (!isPlayerCompleted(nextColor)) {
                return nextIndex;
            }
            nextIndex = (nextIndex + 1) % numberOfPlayers;
            attempts++;
        }
        
        // If all players are completed, return current index
        return currentIndex;
    };

    // Update handleDiceRoll function
   
    const handleDiceRoll = async (rolledValue) => {
      if (!turnState.isDiceRollAllowed || gameEnded) {
          console.log('Dice roll not allowed at this time');
          return;
      }
  
      if (turnState.isComputerTurn) {
          console.log('Cannot manually roll during computer turn');
          return;
      }
  
      // Play the dice roll sound
      try {
          const { sound } = await Audio.Sound.createAsync(
              require('./assets/dice-95077.mp3')  // Ensure this file exists inside assets folder
          );
          await sound.playAsync();
      } catch (error) {
          console.log('Error playing sound:', error);
      }
  
      console.log(`Player rolled: ${rolledValue}`);
      setDiceValue(rolledValue);
      setIsDiceEnabled(false);
  
      // Update turn state
      setTurnState(prev => ({
          ...prev,
          lastRoll: rolledValue
      }));
  
      // Calculate possible moves after roll
      const currentTokens = tokens.filter(
          token => token.color === activeColors[currentPlayer]
      );
  
      let possibleMoves = [];
      currentTokens.forEach(token => {
          const moves = calculatePossibleMoves(token.position, rolledValue, token);
          if (moves.length > 0) {
              possibleMoves = [...possibleMoves, ...moves];
          }
      });
  
      setPossibleMoves(possibleMoves);
  
      // If no moves available, switch to next player
      if (possibleMoves.length === 0) {
          setTimeout(() => {
              setDiceValue(null);
              if (rolledValue !== 6) {
                  const nextPlayer = getNextActivePlayer(currentPlayer);
                  setCurrentPlayer(nextPlayer);
                  setIsDiceEnabled(true);
              } else {
                  setIsDiceEnabled(true);
              }
          }, 1000);
      }
  };

  const moveToken = (targetPosition) => {
    if (!selectedToken || gameEnded) return;
    
    const currentColor = activeColors[currentPlayer];
    let capturedToken = false;

    setTokens(prevTokens => {
        const newTokens = [...prevTokens];
        
        // Check for captures - Look for tokens of a different color
        const tokensAtTarget = newTokens.filter(t => 
            t.position[0] === targetPosition[0] && 
            t.position[1] === targetPosition[1] &&
            t.color !== currentColor
        );
        
        // Handle captures if target is not a safe spot
        // Inside moveToken (capture loop)
if (tokensAtTarget.length > 0 && !isSafeSpot(targetPosition[0], targetPosition[1])) {
  tokensAtTarget.forEach(targetToken => {
    const isProtected = isProtectedPosition(targetToken.position, targetToken.color);
    if (!isProtected) {
      const homePos = getHomePosition(targetToken.color, targetToken.id);
      const tokenIndex = newTokens.findIndex(t => t.id === targetToken.id);
      newTokens[tokenIndex] = {
        ...targetToken,
        position: homePos,
        isHome: true
      };
      capturedToken = true;
      // Store the captured token's color (or details) for extra turn check
      setLastCapture(targetToken.color);
      console.log(`${currentColor} captured ${targetToken.color} token`);
    }
  });
}

        
        // Move the selected token
        const tokenIndex = newTokens.findIndex(token => 
            token.position[0] === selectedToken[0] && 
            token.position[1] === selectedToken[1]
        );
        
        if (tokenIndex !== -1) {
            newTokens[tokenIndex] = {
                ...newTokens[tokenIndex],
                position: targetPosition,
                isHome: false
            };
        }
        
        return newTokens;
    });

    setPossibleMoves([]);
    setSelectedToken(null);
    setDiceValue(null);
    
    // Handle next turn
    if (!gameEnded) {
        if (capturedToken) {
            // When an opponent's token is captured, show a flash message and let the player roll again
            showFlashMessage("You captured a token! Roll again.");
            setTimeout(() => {
                setDiceValue(null);
                setIsDiceEnabled(true);
            }, 800);
        } else if (diceValue === 6) {
            // Player gets another turn when rolling a 6
            setTimeout(() => {
                setDiceValue(null);
                setIsDiceEnabled(true);
            }, 800);
        } else {
            // Otherwise, switch to the next player
            setTimeout(() => {
                const nextPlayer = getNextActivePlayer(currentPlayer);
                setCurrentPlayer(nextPlayer);
                setIsDiceEnabled(true);
            }, 800);
        }
    }
};


    // Add helper function to check if position is protected
    const isProtectedPosition = (position, color) => {
        if (!position || !color) return false;
        
        // Count how many tokens of the same color are at this position
        const tokensAtPosition = tokens.filter(token => 
            token.color === color && 
            token.position[0] === position[0] && 
            token.position[1] === position[1]
        );
        
        // Position is protected if 2 or more tokens of same color are present
        return tokensAtPosition.length >= 2;
    };

    // Add this helper function to show flash messages
    const showFlashMessage = (message) => {
        setFlashMessage(message);
        setShowFlash(true);
        
        // Hide the message after 2 seconds
        setTimeout(() => {
            setShowFlash(false);
            setFlashMessage("");
        }, 2000);
    };

    // Add helper function to check for valid moves
    const hasValidMovesAvailable = (playerColor, diceVal, excludePosition) => {
        const playerTokens = tokens.filter(t => t.color === playerColor);
        
        return playerTokens.some(token => {
            // Skip the token that tried to capture protected tokens
            if (excludePosition && 
                token.position[0] === excludePosition[0] && 
                token.position[1] === excludePosition[1]) {
                return false;
            }

            // Calculate possible moves for this token
            const moves = calculatePossibleMoves(token.position, diceVal, token);
            if (moves.length === 0) return false;

            // For each possible move, check if it's valid
            return moves.some(movePos => {
                // Check if target position has protected tokens
                const tokensAtTarget = tokens.filter(t => 
                    t.position[0] === movePos[0] && 
                    t.position[1] === movePos[1]
                );

                const isTargetSafeSpot = isSafeSpot(movePos[0], movePos[1]);
                
                // If it's a safe spot, move is valid
                if (isTargetSafeSpot) return true;

                // Check if target is protected by other tokens
                const isTargetProtected = tokensAtTarget.length >= 2 && 
                    tokensAtTarget.every(t => t.color === tokensAtTarget[0].color);

                // Move is valid if target is not protected or protected by same color
                return !isTargetProtected || tokensAtTarget[0].color === playerColor;
            });
        });
    };

    // Update handleTokenSelect with new logic
    const handleTokenSelect = (position) => {
        if (!diceValue || gameEnded) return;

        const currentColor = activeColors[currentPlayer];
        const tokensAtPosition = tokens.filter(t => 
            t.position[0] === position[0] && 
            t.position[1] === position[1] && 
            t.color === currentColor
        );

        // If multiple tokens are present, show selection modal
        if (tokensAtPosition.length > 1) {
            setStackedTokens(tokensAtPosition);
            setShowTokenSelection(true);
            setSelectedPosition(position);
            return;
        }

        const token = tokensAtPosition[0];
        if (!token) return;

        if (token.isHome && diceValue !== 6) return;

        const currentPath = playerPaths[currentColor];
        let targetPosition;

        if (token.isHome && diceValue === 6) {
            targetPosition = startPositions[currentColor];
        } else {
            const currentIndex = currentPath.findIndex(([row, col]) => 
                row === position[0] && col === position[1]
            );
            
            if (currentIndex === -1) return;
            
            const targetIndex = currentIndex + diceValue;
            if (targetIndex >= currentPath.length) return;
            
            targetPosition = currentPath[targetIndex];
        }

        // Check if target position has protected tokens
        const tokensAtTarget = tokens.filter(t => 
            t.position[0] === targetPosition[0] && 
            t.position[1] === targetPosition[1]
        );

        const isTargetSafeSpot = isSafeSpot(targetPosition[0], targetPosition[1]);
        
        // Only check for protection if not moving to a safe spot
        if (!isTargetSafeSpot) {
            const isTargetProtected = tokensAtTarget.length >= 2 && 
                tokensAtTarget.every(t => t.color === tokensAtTarget[0].color);

            // If target has protected tokens of different color
            if (isTargetProtected && tokensAtTarget[0].color !== currentColor) {
                // Check if player has other valid moves
                if (hasValidMovesAvailable(currentColor, diceValue, position)) {
                    showFlashMessage("Protected pieces! Try moving another pieces.");
                    return;
                } else {
                    showFlashMessage("No valid moves available. Next player's turn!");
                    setDiceValue(null);
                    const nextPlayer = getNextActivePlayer(currentPlayer);
                    setCurrentPlayer(nextPlayer);
                    return;
                }
            }
        }

        setTokens(prevTokens => {
            const newTokens = prevTokens.map(t => {
                // Move current token
                if (t.color === currentColor && 
                    t.position[0] === position[0] && 
                    t.position[1] === position[1]) {
                    return {
                        ...t,
                        position: targetPosition,
                        isHome: false
                    };
                }
                // Handle opponent tokens at target position (only if not a safe spot)
                else if (!isTargetSafeSpot && 
                         t.position[0] === targetPosition[0] && 
                         t.position[1] === targetPosition[1] && 
                         t.color !== currentColor) {
                    // Only capture if not protected
                    const isProtected = prevTokens.filter(pt => 
                        pt.position[0] === t.position[0] && 
                        pt.position[1] === t.position[1] && 
                        pt.color === t.color
                    ).length >= 2;

                    if (!isProtected) {
                        const homePosition = getHomePosition(t.color, t.id);
                        return {
                            ...t,
                            position: homePosition,
                            isHome: true
                        };
                    } else {
                        // This case shouldn't be reached due to earlier check,
                        // but keeping it for safety
                        Alert.alert(
                            "Protected pieces",
                            "Sorry! You can't capture protected pieces.",
                            [{ text: "OK" }]
                        );
                    }
                }
                return t;
            });
            return newTokens;
        });

        setPossibleMoves([]);
        setSelectedToken(null);
        setDiceValue(null);

        if (!gameEnded) {
            if (diceValue !== 6) {
                const nextPlayer = getNextActivePlayer(currentPlayer);
                setCurrentPlayer(nextPlayer);
            } else if (currentColor === 'green' && gameMode === 'computer') {
                // If computer rolled 6, let it play again after a delay
                setTimeout(handleComputerDiceRoll, 1500);
            }
        }
    };

    const handleStackedTokenSelect = (selectedToken) => {
        setShowTokenSelection(false);
        
        const moves = calculatePossibleMoves(selectedToken.position, diceValue, selectedToken);
        
        if (moves.length > 0) {
            const targetPosition = moves[0];
            
            setTokens(prevTokens => {
                const newTokens = prevTokens.map(token => {
                    if (token.id === selectedToken.id) {
                        // Check if this move is to a winning position
                        if (isWinningPosition(targetPosition, token.color)) {
                            switch(token.color) {
                                case 'red':
                                    setRedTokensCompleted(prev => prev + 1);
                                    break;
                                case 'green':
                                    setGreenTokensCompleted(prev => prev + 1);
                                    break;
                                case 'yellow':
                                    setYellowTokensCompleted(prev => prev + 1);
                                    break;
                                case 'blue':
                                    setBlueTokensCompleted(prev => prev + 1);
                                    break;
                            }
                        }
                        
                        return {
                            ...token,
                            position: targetPosition,
                            isHome: false
                        };
                    }
                    return token;
                });
                return newTokens;
            });

            setPossibleMoves([]);
            setSelectedToken(null);
            setDiceValue(null);
            
            if (diceValue !== 6) {
                const nextPlayer = getNextActivePlayer(currentPlayer);
                setCurrentPlayer(nextPlayer);
            }
        }
    };

    const rollDice = () => {
        if (diceValue !== null || gameEnded) return;  // Prevent dice roll if game is ended
        
        const value = Math.floor(Math.random() * 6) + 1;
        setDiceValue(value);
        
        const currentColor = activeColors[currentPlayer];
        const currentPlayerTokens = tokens.filter(token => token.color === currentColor);
        
        const hasValidMoves = currentPlayerTokens.some(token => 
            calculatePossibleMoves(token.position, value, token).length > 0
        );

        if (!hasValidMoves) {
            setTimeout(() => {
                setDiceValue(null);
                if (!gameEnded) {
                    const nextPlayer = getNextActivePlayer(currentPlayer);
                    setCurrentPlayer(nextPlayer);
                }
            }, 1000);
        }
    };

    // Helper function to get home positions
    const getHomePosition = (color, tokenId) => {
        const homePositions = {
            red: [
                [1, 1], [1, 4], [4, 1], [4, 4]
            ],
            green: [
                [1, 10], [1, 13], [4, 10], [4, 13]
            ],
            yellow: [
                [10, 10], [10, 13], [13, 10], [13, 13]
            ],
            blue: [
                [10, 1], [10, 4], [13, 1], [13, 4]
            ]
        };
        
        // Extract the index from token ID (e.g., "red1" -> 0)
        const index = parseInt(tokenId.slice(-1)) - 1;
        return homePositions[color][index];
    };

    // Update restartGame function
    const restartGame = () => {
        setShowPlayerSelection(true);
        setNumberOfPlayers(null);
        setTokens([]);
        setCurrentPlayer(0);
        setDiceValue(null);
        setPossibleMoves([]);
        setSelectedToken(null);
        setWinners([]);
        setGameEnded(false);
        setRedTokensCompleted(0);
        setGreenTokensCompleted(0);
        setYellowTokensCompleted(0);
        setBlueTokensCompleted(0);
        setActiveColors([]);
        setcurrentMCQ(null);
    };

    // Add this useEffect to monitor token positions
    useEffect(() => {
        const checkTokensInWinPosition = () => {
            let redCount = 0;
            let greenCount = 0;
            let yellowCount = 0;
            let blueCount = 0;

            tokens.forEach(token => {
                if (isWinningPosition(token.position, token.color)) {
                    switch(token.color) {
                        case 'red':
                            redCount++;
                            break;
                        case 'green':
                            greenCount++;
                            break;
                        case 'yellow':
                            yellowCount++;
                            break;
                        case 'blue':
                            blueCount++;
                            break;
                    }
                }
            });

            // Update counters if they don't match current state
            if (redCount !== redTokensCompleted) setRedTokensCompleted(redCount);
            if (greenCount !== greenTokensCompleted) setGreenTokensCompleted(greenCount);
            if (yellowCount !== yellowTokensCompleted) setYellowTokensCompleted(yellowCount);
            if (blueCount !== blueTokensCompleted) setBlueTokensCompleted(blueCount);
        };

        checkTokensInWinPosition();
    }, [tokens]); // Run this effect whenever tokens change

    // Update useEffect for win conditions with proper player count handling
    useEffect(() => {
        const checkWinCondition = () => {
            if (!activeColors.length || gameEnded) return;

            const completedCounts = {
                'red': redTokensCompleted,
                'green': greenTokensCompleted,
                'yellow': yellowTokensCompleted,
                'blue': blueTokensCompleted
            };

            // Check if any active player has completed all tokens
            activeColors.forEach(color => {
                if (completedCounts[color] === 4 && !winners.includes(color)) {
                    const newWinners = [...winners, color];
                    
                    // For 2 players - end game after first player wins
                    if (numberOfPlayers === 2 && newWinners.length === 1) {
                        setWinners(newWinners);
                        setGameEnded(true);
                        Alert.alert(
                            "Game Over!",
                            `${color.toUpperCase()} Wins!\n\nWould you like to start a new game?`,
                            [{ text: "New Game", onPress: restartGame }]
                        );
                    } 
                    // For 3 players - end game after 2nd player
                    else if (numberOfPlayers === 3) {
                        if (newWinners.length === 1) {
                            setWinners(newWinners);
                            Alert.alert("", `1st is ${color.toUpperCase()}`, [{ text: "OK" }]);
                        } else if (newWinners.length === 2) {
                            setWinners(newWinners);
                            setGameEnded(true);
                            Alert.alert(
                                "Game Over!",
                                `Final Rankings:\n\n` +
                                `1st: ${newWinners[0].toUpperCase()}\n` +
                                `2nd: ${color.toUpperCase()}\n\nWould you like to start a new game?`,
                                [{ text: "New Game", onPress: restartGame }]
                            );
                        }
                    }
                    // For 4 players - end game after 3rd player
                    else if (numberOfPlayers === 4) {
                        if (newWinners.length === 1) {
                            setWinners(newWinners);
                            Alert.alert("", `1st is ${color.toUpperCase()}`, [{ text: "OK" }]);
                        } else if (newWinners.length === 2) {
                            setWinners(newWinners);
                            Alert.alert("", `2nd is ${color.toUpperCase()}`, [{ text: "OK" }]);
                        } else if (newWinners.length === 3) {
                            setWinners(newWinners);
                            setGameEnded(true);
                            Alert.alert(
                                "Game Over!",
                                `Final Rankings:\n\n` +
                                `1st: ${newWinners[0].toUpperCase()}\n` +
                                `2nd: ${newWinners[1].toUpperCase()}\n` +
                                `3rd: ${color.toUpperCase()}`,
                                [{ text: "New Game", onPress: restartGame }]
                            );
                        }
                    }
                }
            });
        };

        checkWinCondition();
    }, [redTokensCompleted, greenTokensCompleted, yellowTokensCompleted, blueTokensCompleted, winners, numberOfPlayers, activeColors, gameEnded]);

    // Add this component for the player selection modal
    const PlayerSelectionModal = () => (
        <View style={styles.modalOverlay}>
            <View style={styles.modal}>
                <Text style={styles.modalTitle}>Select Game Mode</Text>
                
                {/* Computer Play Option - Shown First */}
                <TouchableOpacity
                    style={[styles.playerButton, styles.computerButton]}
                    onPress={() => {
                        setGameMode('computer');
                        setNumberOfPlayers(2);
                        setComputerPlayers(['green']); // Set green as computer player
                        setShowPlayerSelection(false);
                        startGame(2);
                    }}
                >
                    <Text style={[styles.playerButtonText, styles.computerButtonText]}>
                        Play with Computer
                    </Text>
                    <Text style={styles.computerSubText}>
                        (You vs Computer)
                    </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Human Play Options */}
                <Text style={styles.sectionTitle}>Play with Friends</Text>
                <View style={styles.playerButtonContainer}>
                    {[2, 3, 4].map(num => (
                        <TouchableOpacity
                            key={num}
                            style={styles.playerButton}
                            onPress={() => {
                                setGameMode('human');
                                setNumberOfPlayers(num);
                                setComputerPlayers([]);
                                setShowPlayerSelection(false);
                                startGame(num);
                            }}
                        >
                            <Text style={styles.playerButtonText}>{num} Players</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    // Add this function to start the game with selected players
    const startGame = (playerCount) => {
        setNumberOfPlayers(playerCount);
        setShowPlayerSelection(false);
        
        // Set active colors based on player count
        let colors;
        switch(playerCount) {
            case 2:
                colors = ['red', 'green'];
                break;
            case 3:
                colors = ['red', 'green', 'yellow'];
                break;
            case 4:
                colors = ['red', 'green', 'yellow', 'blue'];
                break;
            default:
                colors = [];
        }
        setActiveColors(colors);
        
        // Initialize only the tokens for selected players
        const initialTokens = [];
        
        if (colors.includes('red')) {
            initialTokens.push(
                { id: 'red1', color: 'red', position: [1, 1], isHome: true },
                { id: 'red2', color: 'red', position: [1, 4], isHome: true },
                { id: 'red3', color: 'red', position: [4, 1], isHome: true },
                { id: 'red4', color: 'red', position: [4, 4], isHome: true }
            );
        }
        
        if (colors.includes('green')) {
            initialTokens.push(
                { id: 'green1', color: 'green', position: [1, 10], isHome: true },
                { id: 'green2', color: 'green', position: [1, 13], isHome: true },
                { id: 'green3', color: 'green', position: [4, 10], isHome: true },
                { id: 'green4', color: 'green', position: [4, 13], isHome: true }
            );
        }
        
        if (colors.includes('yellow')) {
            initialTokens.push(
                { id: 'yellow1', color: 'yellow', position: [10, 10], isHome: true },
                { id: 'yellow2', color: 'yellow', position: [10, 13], isHome: true },
                { id: 'yellow3', color: 'yellow', position: [13, 10], isHome: true },
                { id: 'yellow4', color: 'yellow', position: [13, 13], isHome: true }
            );
        }
        
        if (colors.includes('blue')) {
            initialTokens.push(
                { id: 'blue1', color: 'blue', position: [10, 1], isHome: true },
                { id: 'blue2', color: 'blue', position: [10, 4], isHome: true },
                { id: 'blue3', color: 'blue', position: [13, 1], isHome: true },
                { id: 'blue4', color: 'blue', position: [13, 4], isHome: true }
            );
        }
        

        setTokens(initialTokens);
        setCurrentPlayer(0);
        setDiceValue(null);
        setPossibleMoves([]);
        setSelectedToken(null);
        setWinners([]);
        setGameEnded(false);
        setRedTokensCompleted(0);
        setGreenTokensCompleted(0);
        setYellowTokensCompleted(0);
        setBlueTokensCompleted(0);
    };

    // Update current player display
    const getCurrentPlayerText = () => {
        if (!activeColors.length) return "";
        const currentColor = activeColors[currentPlayer];
        return `${currentColor.toUpperCase()}'s Turn`;
    };

    // Add this function to check if a position is a winning position
    const isWinningPosition = (position, color) => {
        const winningPositions = {
            'red': [7, 6],      // Red's final position
            'green': [6, 7],    // Green's final position
            'yellow': [7, 8],   // Yellow's final position
            'blue': [8, 7]      // Blue's final position
        };

        if (!position || !color || !winningPositions[color]) return false;

        const [targetRow, targetCol] = winningPositions[color];
        const [currentRow, currentCol] = position;

        return currentRow === targetRow && currentCol === targetCol;
    };

    // Update useEffect for turn management
    useEffect(() => {
        if (!gameEnded && isPlayerCompleted(activeColors[currentPlayer])) {
            const nextPlayer = getNextActivePlayer(currentPlayer);
            setCurrentPlayer(nextPlayer);
        }
    }, [currentPlayer, activeColors, gameEnded]);

    // Add this function to handle computer moves
    const handleComputerTurn = useCallback(() => {
      if (!turnState.isComputerTurn || gameMode !== 'computer') return;
    
      const currentColor = activeColors[currentPlayer];
      if (!computerPlayers.includes(currentColor)) {
        setIsComputerTurn(false);
        return;
      }
    
      // Simulate thinking time
      setTimeout(() => {
        // Roll dice
        const value = Math.floor(Math.random() * 6) + 1;
        setDiceValue(value);
        console.log('Computer rolled:', value);
    
        // Get all possible moves for current player tokens
        const currentTokens = tokens.filter(token => token.color === currentColor);
        let validMoves = [];
    
        currentTokens.forEach(token => {
          const moves = calculatePossibleMoves(token.position, value, token);
          if (moves.length > 0) {
            validMoves.push({ token, moves });
          }
        });
    
        // extraTurn flag indicates whether a capture occurred.
        let extraTurn = false;
    
        // Process AI move after a delay
        setTimeout(() => {
          if (validMoves.length > 0) {
            // Prioritize moves based on strategy.
            // Assume chooseBestMove returns an object that includes a "captured" flag if that move results in a capture.
            const prioritizedMove = chooseBestMove(validMoves, currentColor);
            if (prioritizedMove) {
              if (prioritizedMove.captured) {
                extraTurn = true;
              }
              // Execute the move (this function will update tokens accordingly).
              moveToken(prioritizedMove.moves[0]);
            }
          }
    
          // After processing the move, transition the turn.
          setTimeout(() => {
            setDiceValue(null);
            // Grant an extra turn if a capture occurred or if dice value is 6.
            if (extraTurn || value === 6) {
              console.log('Computer gets another turn');
              setTurnState(prev => ({
                ...prev,
                isDiceRollAllowed: true,
                isComputerTurn: true
              }));
            } else {
              console.log('Computer turn ending');
              const nextPlayer = getNextActivePlayer(currentPlayer);
              setCurrentPlayer(nextPlayer);
              setTurnState(prev => ({
                ...prev,
                isComputerTurn: false,
                isDiceRollAllowed: true
              }));
            }
            setIsDiceEnabled(true);
          }, 1000);
        }, 1000);
      }, 1000);
    }, [turnState.isComputerTurn, gameMode, activeColors, currentPlayer, tokens, computerPlayers, getNextActivePlayer]);
    
    // Add AI strategy function
    const chooseBestMove = (validMoves, currentColor) => {
        // Priority order:
        // 1. Get token out of home if possible
        // 2. Capture opponent's token
        // 3. Move to safe spot
        // 4. Move furthest token towards finish
        // 5. Random move if nothing else

        // Check for getting token out of home
        const homeMove = validMoves.find(({ token }) => token.isHome);
        if (homeMove) return homeMove;

        // Check for capture opportunities
        const captureMove = validMoves.find(({ token, moves }) => {
            const targetPosition = moves[0];
            const opponentTokens = tokens.filter(t => 
                t.color !== currentColor && 
                t.position[0] === targetPosition[0] && 
                t.position[1] === targetPosition[1] &&
                !isProtectedPosition(targetPosition, t.color)
            );
            return opponentTokens.length === 1;
        });
        if (captureMove) return captureMove;

        // Check for safe spot moves
        const safeMoves = validMoves.filter(({ moves }) => 
            moves.some(move => isSafeSpot(move[0], move[1]))
        );
        if (safeMoves.length > 0) {
            return safeMoves[0];
        }

        // Move token that's furthest along
        const greenPath = playerPaths['green'];
        const movesByProgress = validMoves.map(move => {
            const currentIndex = greenPath.findIndex(([row, col]) => 
                row === move.token.position[0] && 
                col === move.token.position[1]
            );
            return { ...move, progress: currentIndex };
        });

        movesByProgress.sort((a, b) => b.progress - a.progress);
        return movesByProgress[0];
    };

    // Add game mode selection UI
    const GameModeSelection = ({ onSelect }) => (
        <View style={styles.modeSelection}>
            <Text style={styles.modeTitle}>Select Game Mode</Text>
            <TouchableOpacity 
                style={styles.modeButton} 
                onPress={() => onSelect('computer')}
            >
                <Text style={styles.modeButtonText}>Play with Computer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.modeButton} 
                onPress={() => onSelect('human')}
            >
                <Text style={styles.modeButtonText}>Play with Friends</Text>
            </TouchableOpacity>
        </View>
    );

    // Update your useEffect to handle computer turns
    useEffect(() => {
        if (turnState.isComputerTurn) {
            handleComputerTurn();
        }
    }, [turnState.isComputerTurn, handleComputerTurn]);

    // Update your player selection logic
    const handlePlayerCountSelection = (count) => {
        setNumberOfPlayers(count);
        setActiveColors(playerColors[count]);
        
        if (gameMode === 'computer') {
            // Set computer players (e.g., all except first player)
            const computerPlayerColors = playerColors[count].slice(1);
            setComputerPlayers(computerPlayerColors);
        }
        
        setShowPlayerSelection(false);
    };

    // Add this function to handle automatic dice roll for computer
// This function handles the computer’s dice roll.
const handleComputerDiceRoll = useCallback(() => {
  if (diceValue !== null || gameEnded) return;
  
  console.log('Computer is rolling dice');
  
  // Simulate dice roll.
  const value = Math.floor(Math.random() * 6) + 1;
  setDiceValue(value);
  console.log('Computer rolled:', value);
  
  // Get computer tokens (assumed green) and calculate valid moves.
  const currentTokens = tokens.filter(token => token.color === 'green');
  let validMoves = [];
  
  currentTokens.forEach(token => {
    const moves = calculatePossibleMoves(token.position, value, token);
    if (moves.length > 0) {
      validMoves.push({ token, moves });
    }
  });
  
  // Process move after delay.
  setTimeout(() => {
    if (validMoves.length > 0) {
      // Choose the best move based on your strategy.
      const bestMove = chooseBestMove(validMoves);
      if (bestMove) {
        console.log('Computer choosing move:', bestMove);
        // Execute the move; the extra turn logic is handled inside this function.
        handleComputerMove(bestMove.token.position, bestMove.moves[0], value);
      }
    } else {
      // No valid moves.
      console.log('No valid moves for computer');
      setDiceValue(null);
      if (value !== 6) {
        const nextPlayer = getNextActivePlayer(currentPlayer);
        setCurrentPlayer(nextPlayer);
      } else {
        // If rolled 6 but no valid moves, re-roll.
        setTimeout(handleComputerDiceRoll, 1000);
      }
    }
  }, 1500);
}, [currentPlayer, tokens, gameEnded, diceValue]);


// This function executes the move and grants an extra turn if a capture occurred.
const handleComputerMove = (tokenPosition, targetPosition, rolledValue) => {
  console.log(`Computer executing move from ${tokenPosition} to ${targetPosition}`);
  
  // Track if a capture occurs.
  let capturedToken = false;

  setTimeout(() => {
    setTokens(prevTokens => {
      const newTokens = [...prevTokens];
      
      // Check for captures: look for any non-green tokens at the target.
      const tokensAtTarget = newTokens.filter(t => 
        t.position[0] === targetPosition[0] &&
        t.position[1] === targetPosition[1] &&
        t.color !== 'green'
      );
      
      // If the target cell is not a safe spot and there are opponent tokens, process capture.
      if (tokensAtTarget.length > 0 && !isSafeSpot(targetPosition[0], targetPosition[1])) {
        tokensAtTarget.forEach(targetToken => {
          // Only capture if the target token is not protected.
          const isProtected = isProtectedPosition(targetToken.position, targetToken.color);
          if (!isProtected) {
            const homePos = getHomePosition(targetToken.color, targetToken.id);
            const tokenIndex = newTokens.findIndex(t => t.id === targetToken.id);
            newTokens[tokenIndex] = {
              ...targetToken,
              position: homePos,
              isHome: true
            };
            capturedToken = true;
            console.log(`Computer captured ${targetToken.color} token`);
          }
        });
      }
      
      // Move the computer's token.
      const tokenIndex = newTokens.findIndex(t => 
        t.color === 'green' &&
        t.position[0] === tokenPosition[0] &&
        t.position[1] === tokenPosition[1]
      );
      
      if (tokenIndex !== -1) {
        newTokens[tokenIndex] = {
          ...newTokens[tokenIndex],
          position: targetPosition,
          isHome: false
        };
        console.log('Computer token moved successfully');
      }
      
      return newTokens;
    });

    // Clear move state.
    setPossibleMoves([]);
    setSelectedToken(null);
    setDiceValue(null);
    
    // After the move, decide whether to grant an extra turn.
    setTimeout(() => {
      if (capturedToken) {
        // Extra chance if a token was captured.
        console.log('Computer captured a token; extra roll granted.');
        setTurnState(prev => ({
          ...prev,
          isDiceRollAllowed: true,
          isComputerTurn: true
        }));
      } else if (rolledValue === 6) {
        // Extra turn on a roll of 6.
        console.log('Computer rolled 6, getting another turn.');
        setTurnState(prev => ({
          ...prev,
          isDiceRollAllowed: true,
          isComputerTurn: true
        }));
      } else {
        // Otherwise, end the computer's turn.
        console.log('Computer turn ending.');
        const nextPlayer = getNextActivePlayer(currentPlayer);
        setCurrentPlayer(nextPlayer);
        setTurnState(prev => ({
          ...prev,
          isComputerTurn: false,
          isDiceRollAllowed: true
        }));
      }
      setIsDiceEnabled(true);
    }, 1000);
  }, 1000);
};


    // Update computer turn useEffect with better state management
    const executeComputerMove = (token, targetPosition, rolledValue) => {
      console.log(`Computer executing move to ${targetPosition}`);
      
      // Use a local variable to track if a capture occurs.
      let captured = false;
    
      setTokens(prevTokens => {
        const newTokens = [...prevTokens];
    
        // Handle captures: check if any token (of a different color) is present at target
        const tokensAtTarget = newTokens.filter(t =>
          t.position[0] === targetPosition[0] &&
          t.position[1] === targetPosition[1]
        );
    
        if (tokensAtTarget.length > 0 && !isSafeSpot(targetPosition[0], targetPosition[1])) {
          tokensAtTarget.forEach(targetToken => {
            if (targetToken.color !== 'green') {
              const homePos = getHomePosition(targetToken.color, targetToken.id);
              const tokenIndex = newTokens.findIndex(t => t.id === targetToken.id);
              newTokens[tokenIndex] = {
                ...targetToken,
                position: homePos,
                isHome: true
              };
              captured = true;
              console.log(`${activeColors[currentPlayer]} captured ${targetToken.color} token`);
            }
          });
        }
    
        // Move the computer's token to targetPosition
        const tokenIndex = newTokens.findIndex(t => t.id === token.id);
        if (tokenIndex !== -1) {
          newTokens[tokenIndex] = {
            ...newTokens[tokenIndex],
            position: targetPosition,
            isHome: false
          };
        }
        return newTokens;
      });
    
      // Handle turn transition after executing the move
      setTimeout(() => {
        if (captured) {
          // Extra chance: if a token was captured, allow the computer to roll again
          setDiceValue(null);
          setTurnState(prev => ({
            ...prev,
            isDiceRollAllowed: true,
            isComputerTurn: true // Keep computer's turn
          }));
          console.log("Computer captured a token; extra roll granted.");
        } else if (rolledValue === 6) {
          // For a roll of 6, allow another turn
          setDiceValue(null);
          setTurnState(prev => ({
            ...prev,
            isDiceRollAllowed: true,
            isComputerTurn: true
          }));
        } else {
          // Otherwise, end computer turn and pass turn to the next player
          setDiceValue(null);
          const nextPlayer = getNextActivePlayer(currentPlayer);
          setCurrentPlayer(nextPlayer);
          setTurnState(prev => ({
            ...prev,
            isComputerTurn: false,
            isDiceRollAllowed: true
          }));
        }
        setIsDiceEnabled(true);
      }, 1000);
    };
    

    // Add turn observer effect
    useEffect(() => {
        // Observer for turn management
        const updateTurnState = () => {
            const isComputerTurn = activeColors[currentPlayer] === 'green' && gameMode === 'computer';
            
            setTurnState(prev => ({
                ...prev,
                isComputerTurn,
                isDiceRollAllowed: !isComputerTurn || (isComputerTurn && diceValue === null),
            }));

            // Automatically disable dice during computer's turn
            if (isComputerTurn) {
                setIsDiceEnabled(false);
                console.log('Dice disabled for computer turn');
            } else {
                setIsDiceEnabled(true);
                console.log('Dice enabled for player turn');
            }
        };

        updateTurnState();
    }, [currentPlayer, gameMode, diceValue]);

    // Fetch MCQ data from Firestore
    useEffect(() => {
        const fetchMCQs = async () => {
          try {
            const mcqsSnapshot = await getDocs(mcqsRef);
            const mcqsList = mcqsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            // Sort the MCQs in ascending order by questionNumber
            const sortedMCQs = mcqsList.sort((a, b) => a.questionNumber - b.questionNumber);
            setMcqs(sortedMCQs);
            if (sortedMCQs.length > 0) {
              setCurrentMCQ(sortedMCQs[0]); // Set the first MCQ as current
              setTimeThresholds({
                timeToGet1: sortedMCQs[0].timeToGet1,
                timeToGet2: sortedMCQs[0].timeToGet2,
                timeToGet3: sortedMCQs[0].timeToGet3,
                timeToGet4: sortedMCQs[0].timeToGet4,
                timeToGet5: sortedMCQs[0].timeToGet5,
                timeToGet6: sortedMCQs[0].timeToGet6,
              });
              startTimer(); // Start timer for the first question
            }
          } catch (error) {
            console.error("Error fetching MCQs: ", error);
          }
        };
      
        fetchMCQs();
      }, [mcqsRef]);
      const scaleAnim = useRef(new Animated.Value(1)).current;

      useEffect(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, []);     
      
      



      const fadeAnim = useRef(new Animated.Value(0)).current; // Animation value

      useEffect(() => {
          if (showTokenSelection) {
              Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 300, // Smooth fade-in
                  useNativeDriver: true,
              }).start();
          } else {
              fadeAnim.setValue(0); // Reset when closed
          }
      }, [showTokenSelection]);
  








    const startTimer = () => {
        setStartTime(Date.now()); // Reset the start time
    };
    const [timeThresholds, setTimeThresholds] = useState({
        timeToGet1: 0,
        timeToGet2: 0,
        timeToGet3: 0,
        timeToGet4: 0,
        timeToGet5: 0,
        timeToGet6: 0,
    });

    const handleMCQAnswerSelection = async (selectedAnswer) => {
  const endTime = Date.now();
  const timeTaken = Math.floor((endTime - startTime) / 1000); // time in seconds
  setTimeTaken(timeTaken);

  console.log("Selected Answer (option number):", selectedAnswer);
  console.log("Correct Answer (stored as option number):", currentMCQ.correctOption);

  // Extract time thresholds from the current MCQ
  const { timeToGet1, timeToGet2, timeToGet3, timeToGet4, timeToGet5, timeToGet6 } = currentMCQ;
  setTimeThresholds({
    timeToGet1,
    timeToGet2,
    timeToGet3,
    timeToGet4,
    timeToGet5,
    timeToGet6,
  });

  // Check if the selected option number (string) equals the correct option stored
  const isCorrect = selectedAnswer === currentMCQ.correctOption;

  // Set feedback state
  setSelectedAnswerState({
    selected: selectedAnswer,
    isCorrect: isCorrect,
    showFeedback: true
  });
  setFeedbackColor(isCorrect ? 'green' : 'red');

  // Delay 2 seconds to show feedback then move to the next question
  setTimeout(() => {
    let rolledValue;
    if (isCorrect) {
      if (timeTaken <= timeToGet6) {
        rolledValue = 6;
      } else if (timeTaken <= timeToGet5) {
        rolledValue = 5;
      } else if (timeTaken <= timeToGet4) {
        rolledValue = 4;
      } else if (timeTaken <= timeToGet3) {
        rolledValue = 3;
      } else if (timeTaken <= timeToGet2) {
        rolledValue = 2;
      } else if (timeTaken <= timeToGet1) {
        rolledValue = 1;
      } else {
        rolledValue = 1;
      }
      setDiceValue(rolledValue);
      Alert.alert('Success', `You rolled a ${rolledValue} on the dice!`);
      handleDiceRoll(rolledValue);
    } else {
      setDiceValue(1);
      Alert.alert('Incorrect', 'You rolled a 1 on the dice!');
      handleDiceRoll(1);
    }

    // Reset timer and feedback state for the next question
    setStartTime(null);
    setSelectedAnswerState({
      selected: null,
      isCorrect: null,
      showFeedback: false
    });
    setFeedbackColor('');

    // Determine next MCQ in sorted order (cycle back to the start if needed)
    const currentIndex = mcqs.findIndex(mcq => mcq.questionNumber === currentMCQ.questionNumber);
    const nextIndex = (currentIndex + 1) % mcqs.length;
    if (mcqs[nextIndex]) {
      setCurrentMCQ(mcqs[nextIndex]);
      setTimeThresholds({
        timeToGet1: mcqs[nextIndex].timeToGet1,
        timeToGet2: mcqs[nextIndex].timeToGet2,
        timeToGet3: mcqs[nextIndex].timeToGet3,
        timeToGet4: mcqs[nextIndex].timeToGet4,
        timeToGet5: mcqs[nextIndex].timeToGet5,
        timeToGet6: mcqs[nextIndex].timeToGet6,
      });
      startTimer(); // Restart timer for the new question
    } else {
      Alert.alert('Quiz Complete', 'You have answered all the questions!');
      // Optionally reset here if you want to restart the quiz:
      // setCurrentMCQ(mcqs[0]);
      // setTimeThresholds({ ... });
      // startTimer();
    }
  }, 2000);
};

      
    const [elapsedTime, setElapsedTime] = useState(0); // Timer state

    // Function to format time in MM:SS
    const formatTime = (timeInSeconds) => {
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const seconds = timeInSeconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    

    // Start timer when a new MCQ is displayed
    useEffect(() => {
      // If player hasn't been selected (i.e. showPlayerSelection is true) or there's no currentMCQ, don't start the timer.
      if (showPlayerSelection && !currentMCQ) return;
    
      // Only start timer when it's the player's turn and no dice value is present.
      if (currentTurn === playerRole && diceValue === null) {
        setElapsedTime(0); // Reset elapsed time
        const timer = setInterval(() => {
          setElapsedTime(prevTime => prevTime + 1);
        }, 1000);
        return () => clearInterval(timer);
      }
    }, [showPlayerSelection, currentMCQ, currentTurn, diceValue, playerRole]);





    useEffect(() => {
      if (!lastCapture) return; // No capture occurred
    
      // Determine next player's index and color
      const nextPlayerIndex = getNextActivePlayer(currentPlayer);
      const nextPlayerColor = activeColors[nextPlayerIndex];
    
      // Debug logging to verify values
      console.log("lastCapture:", lastCapture, "nextPlayerColor:", nextPlayerColor);
    
      // If the captured token belongs to the next player, grant extra chance
      if (lastCapture === nextPlayerColor) {
        console.log("Extra chance granted: Captured token belonged to the next player.");
        showFlashMessage("You captured the next player's token! Roll again.");
        setTimeout(() => {
          setDiceValue(null);
          setIsDiceEnabled(true);
        }, 800);
      } else {
        console.log("No extra chance: Captured token does not belong to next player.");
      }
    
      // Delay resetting lastCapture to ensure the effect runs properly
      setTimeout(() => {
        setLastCapture(null);
      }, 100);
    }, [lastCapture, currentPlayer, activeColors]);
    







    
    return (
        <ImageBackground source={require('./assets/cool_background_d.png')} style={styles.background}>
        <View style={styles.container}>
            {showPlayerSelection ? (
                gameMode ? (
                    <PlayerSelectionModal />
                ) : (
                    <GameModeSelection onSelect={(mode) => setGameMode(mode)} />
                )
            ) : (
                <>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    
                    {/* Flash Message */}
                    {showFlash && (
                        <View style={styles.flashMessage}>
                            <Text style={styles.flashText}>{flashMessage}</Text>
                        </View>
                    )}
                    
                    
                    <Text style={styles.playerText}>
                        {getCurrentPlayerText()}
                    </Text>
                    

                    <View style={styles.container1}>
      <ImageBackground 
        source={require('./assets/ludoBoard2.png')}
        style={styles.background1}
      >
        <View style={styles.overlay1}>
          <Board 
            style={styles.board}
            currentPlayer={currentPlayer}
            diceValue={diceValue}
            tokens={tokens}
            onMoveToken={moveToken}
            possibleMoves={possibleMoves}
            onTokenSelect={handleTokenSelect}
          />
        </View>
      </ImageBackground>
    </View>

                    
                    {/* Show dice if game is not ended */}
                    <View style={styles.diceTimerContainer}>
  {!gameEnded && (
    <TouchableOpacity 
      style={[styles.dice, !diceValue && styles.diceEnabled]} 
      disabled={diceValue !== null}  // Disable only when dice shows a value
    >
      <Text style={styles.diceText}>{diceValue || '?'}</Text>
    </TouchableOpacity>
  )}
  <TimerDisplay 
    timeToGet1={timeThresholds.timeToGet1}
    timeToGet2={timeThresholds.timeToGet2}
    timeToGet3={timeThresholds.timeToGet3}
    timeToGet4={timeThresholds.timeToGet4}
    timeToGet5={timeThresholds.timeToGet5}
    timeToGet6={timeThresholds.timeToGet6}
  />

                    
                    <Animated.Text style={[styles.futuristicTimer, { transform: [{ scale: scaleAnim }] }]}>
  {formatTime(elapsedTime)}
  </Animated.Text> 
  </View>
                    {currentMCQ && currentTurn === playerRole && diceValue === null && TimerDisplay? (
  <View style={styles.futuristicContainer}>
    
    {/* Render question: show image if available, else text */}
    <Text style={styles.futuristicQuestionText}>
    {currentMCQ.questionText}
  </Text>
    {currentMCQ.questionImage && (
    <Image
      source={{ uri: currentMCQ.questionImage }}
      style={styles.futuristicQuestionImage}
      resizeMode="cover"
    />
  )}
  
  
    {/* Render options */}
    {currentMCQ.options.map((option, index) => (
      <TouchableOpacity
        key={index}
        style={styles.futuristicAnswerOption}
        onPress={() => handleMCQAnswerSelection((index + 1).toString())}
      >
        <Text style={styles.futuristicAnswerText}>
            {option.text}
          </Text>
        {option.image && (
          <Image
            source={{ uri: option.image }}
            style={styles.futuristicOptionImage}
            resizeMode="cover"
          />
        )}
          
        
      </TouchableOpacity>
    ))}
  </View>
) : ( 
  <Text style={styles.futuristicWaitingText}>
    Waiting for your turn...
  </Text>
)}
<StatusBar style="auto" />
                    
                    {/* Modified Token Selection Modal */}
{showTokenSelection && (
            <View style={styles.alertOverlay}>
                <Animated.View style={[styles.alertModal, { opacity: fadeAnim }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>✨ Select Your Piece</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setShowTokenSelection(false);
                                setStackedTokens([]);
                                setSelectedPosition(null);
                            }}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tokenList}>
                        {stackedTokens.map((token, index) => (
                            <TouchableOpacity
                                key={token.id}
                                style={styles.tokenOption}
                                onPress={() => handleStackedTokenSelect(token)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.tokenText}>🚀 Piece {index + 1}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>
                    )}

                    {/* Add Winners Display */}
                    {winners.length > 0 && !gameEnded && (
                        <View style={styles.winnersContainer}>
                            <Text style={styles.winnersTitle}>Winners:</Text>
                            {winners.map((color, index) => (
                                <Text key={color} style={[styles.winnerText, { color }]}>
                                    {index + 1}. {color.toUpperCase()}
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* Add Game Completion Modal */}
                    {gameEnded && (
                        <View style={styles.modalOverlay}>
                            <View style={styles.modal}>
                                <Text style={styles.modalTitle}>Game Completed!</Text>
                                <View style={styles.winnersListContainer}>
                                    {winners.map((color, index) => (
                                        <Text key={color} style={styles.winnerListText}>
                                            {index + 1}. {color.toUpperCase()}
                                        </Text>
                                    ))}
                                </View>
                                <TouchableOpacity
                                    style={styles.restartButton}
                                    onPress={restartGame}
                                >
                                    <Text style={styles.restartButtonText}>Restart Game</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Add Ranking Board */}
                    {winners.length > 0 && !gameEnded && (
                        <View style={styles.rankingBoard}>
                            <Text style={styles.rankingTitle}>Current Rankings:</Text>
                            {winners.map((color, index) => (
                                <Text 
                                    key={color} 
                                    style={[styles.rankingText, { color }]}
                                >
                                    {index + 1}. {color.toUpperCase()}
                                    {index === 0 ? ' 🥇' : index === 1 ? ' 🥈' : ' 🥉'}
                                </Text>
                            ))}
                        </View>
                    )}
                    </ScrollView>
                </>
            )}
        </View>
        </ImageBackground>
    );
}

// App Component with Navigation
const App = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Signup">
    <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CountryState" component={CountryStateScreen} options={{ headerShown: false }}/>
      {/* <Stack.Screen name="Country" component={CountryScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="State" component={StateScreen} options={{ headerShown: false }}/> */}
      <Stack.Screen name="Exam" component={ExamScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Paper" component={PaperScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Subject" component={SubjectScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Chapter" component={ChapterScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Create or Join Room" component={CreateOrJoinRoomScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="MCQ" component={MCQScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Ludo" component={Ludo} options={{ headerShown: false }}/>
      
    </Stack.Navigator>
  </NavigationContainer>
);

export default App;


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
      flex: 1,
      padding: 20,
      //backgroundColor: 'red', // Dark background for a modern look
      
      justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 20,
},

playerText: {
  fontSize: 32,             // Larger font size for emphasis
  fontWeight: '900',        // Extra-bold for a powerful look
  fontFamily: 'monospace',  // Monospace font adds a techy, futuristic vibe
  color: '#FF4081',         // Vibrant neon pink
  letterSpacing: 4,         // Increased letter spacing for a stylish touch
  textAlign: 'center',
  marginVertical: 20,
  textShadowColor: 'rgba(0, 0, 0, 0.8)',  // Darker, deeper shadow for contrast
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 8,
},
  // board: {
  //     width: 380,
  //     height: 360,
  //     backgroundColor: '#ffffff',
  //     borderRadius:0,
  //     shadowColor: "#6366f1",
  //     shadowOffset: {
  //         width: 0,
  //         height: 10,
  //     },
  //     shadowOpacity: 0.25,
  //     shadowRadius: 15,
  //     elevation: 20,
  //     borderWidth: 3,
  //     //borderColor: 'rgba(99, 102, 241, 0.3)',
  //     //padding: 2,  // Added padding for inner glow effect
  // },
  row: {
      flexDirection: 'row',
  },
  cell: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(99, 102, 241, 0.15)',
      borderRadius: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  pathCell: {
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(99, 102, 241, 0.2)',
      borderRadius: 6,
  },
  highlightedCell: {
      backgroundColor: 'rgba(250, 204, 21, 0.15)',
      borderWidth: 2,
      borderColor: '#facc15',
      shadowColor: "#facc15",
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 5,
  },
  dice: {
      width: 80,
      height: 80,
      backgroundColor: '#ffffff',
      borderRadius: 24,  // More rounded corners
      justifyContent: 'center',
      alignItems: 'center',
      margin: 25,
      shadowColor: "#6366f1",
      shadowOffset: {
          width: 0,
          height: 6,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 12,
      borderWidth: 3,
      borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  diceEnabled: {
      backgroundColor: '#ffffff',
      transform: [{ scale: 1.05 }],
      borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  diceText: {
      fontSize: 38,
      fontWeight: '800',
      color: '#4f46e5',
      textShadowColor: 'rgba(79, 70, 229, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },

  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
},
alertModal: {
    width: '85%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#00ccff',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backdropFilter: 'blur(10px)', // Glass effect (works in web)
},
modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
},
modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ccff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 204, 255, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
},
closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
},
closeButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
},
tokenList: {
    marginTop: 10,
},
tokenOption: {
    backgroundColor: 'rgba(0, 150, 255, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#009dff',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#00ccff',
},
tokenText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 204, 255, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
},

token: {
  borderWidth: 2.5,         // Thicker border for a premium look
  borderColor: '#ccc',      // Light gray border to mimic a metallic edge
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.4,
  shadowRadius: 4,
  elevation: 8,             // Android shadow for depth
},

tokenContainer: {
  margin: 1,
  overflow: 'hidden', // Ensure the image is clipped to the circular shape
},
tokenImage: {
  resizeMode: 'cover',
},





tokenHighlight: {
  position: 'absolute',
  top: '10%',               // Position the highlight near the top-left
  left: '10%',
  backgroundColor: 'rgba(255, 255, 255, 0.6)', // Semi-transparent white for a glossy effect
},
  redToken: {
      backgroundColor: '#ef4444',
      borderColor: '#b91c1c',
      shadowColor: '#991b1b',
  },
  greenToken: {
      backgroundColor: '#10b981',
      borderColor: '#047857',
      shadowColor: '#065f46',
  },
  yellowToken: {
      backgroundColor: '#f59e0b',
      borderColor: '#b45309',
      shadowColor: '#92400e',
  },
  blueToken: {
      backgroundColor: '#3b82f6',
      borderColor: '#1d4ed8',
      shadowColor: '#1e40af',
  },
  safeSpot: {
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      borderWidth: 2,
      borderColor: 'rgba(99, 102, 241, 0.25)',
      borderRadius: 8,
      shadowColor: "#6366f1",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
  },
  multipleTokenContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      gap: 0.5,
  },
  modalOverlay: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  modal: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 25,
      shadowColor: "#6366f1",
      shadowOffset: {
          width: 0,
          height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 15,
      borderWidth: 3,
      borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 15,
  },
  closeButton: {
      padding: 8,
      borderRadius: 15,
      backgroundColor: '#ff4444',
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
  },
  closeButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
  },
  modalTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: 15,
      letterSpacing: 1,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },
  tokenOption: {
      padding: 16,
      borderWidth: 2,
      borderColor: 'rgba(99, 102, 241, 0.25)',
      borderRadius: 16,
      marginVertical: 6,
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      shadowColor: "#6366f1",
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 4,
  },
  tokenText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1e293b',
      textAlign: 'center',
      letterSpacing: 0.5,
  },
  winnersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 255, 0.5)',
    backdropFilter: 'blur(12px)',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
},
winnersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#00E6FF',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 5,
},
winnerText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1.2,
},
modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
},
modal: {
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    padding: 28,
    borderRadius: 20,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00E6FF',
    shadowColor: '#00E6FF',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
},
modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
    marginBottom: 15,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
},
winnersListContainer: {
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
},
winnerListText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0ff',
    textShadowColor: 'rgba(0, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    marginVertical: 6,
},
restartButton: {
    backgroundColor: '#00E6FF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#00E6FF',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 12,
},
restartButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
},
rankingBoard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 255, 0.5)',
    backdropFilter: 'blur(14px)',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
},
rankingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#00E6FF',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 5,
},
rankingText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1.2,
},
  flashMessage: {
      position: 'absolute',
      top: '20%',
      left: '10%',
      right: '10%',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',  // Darker background
      padding: 20,
      borderRadius: 20,
      alignItems: 'center',
      zIndex: 1000,
      shadowColor: "#6366f1",
      shadowOffset: {
          width: 0,
          height: 5,
      },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 10,
      borderWidth: 2,
      borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  flashText: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
      letterSpacing: 0.5,
  },
  homeArea: {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderRadius: 14,
      padding: 10,
      margin: 3,
      shadowColor: "#6366f1",
      shadowOffset: {
          width: 0,
          height: 3,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 6,
      borderWidth: 2,
      borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  playerButtonContainer: {
      width: '100%',
      gap: 10,
  },
  playerButton: {
      backgroundColor: '#4CAF50',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 5,
  },
  playerButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
  },
  modeSelection: {
      backgroundColor: '#ffffff',
      padding: 25,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: "#6366f1",
      shadowOffset: {
          width: 0,
          height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 15,
  },
  modeTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: 20,
      textAlign: 'center',
  },
  modeButton: {
      backgroundColor: '#4f46e5',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginVertical: 8,
      width: 200,
  },
  modeButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
  },
  computerButton: {
      backgroundColor: '#3b82f6', // Different color for computer button
      marginBottom: 20,
      padding: 20,
      borderWidth: 2,
      borderColor: '#60a5fa',
  },
  computerButtonText: {
      fontSize: 22,
      fontWeight: '700',
  },
  computerSubText: {
      color: '#ffffff',
      fontSize: 16,
      marginTop: 5,
      opacity: 0.9,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: 15,
      textAlign: 'center',
  },
  divider: {
      height: 2,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      width: '100%',
      marginVertical: 20,
  },
  modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: 25,
      textAlign: 'center',
  },
  playerButtonContainer: {
      width: '100%',
      gap: 10,
  },
  playerButton: {
      backgroundColor: '#4f46e5',
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginVertical: 5,
      shadowColor: "#6366f1",
      shadowOffset: {
          width: 0,
          height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 8,
  },
  playerButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
  },
  modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
      backgroundColor: '#ffffff',
      padding: 25,
      borderRadius: 20,
      width: '80%',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
  },
  mcqContainer: {
      backgroundColor: '#ffeb3b', // Bright yellow background for a cheerful look
      borderRadius: 20,
      padding: 30,
      shadowColor: '#000',
      shadowOffset: {
          width: 0,
          height: 5,
      },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
      marginBottom: 20,
      width: '100%', // Set width to 100% to cover the available space
      alignSelf: 'center', // Center the container
  },
  questionText: {
      fontSize: 26, // Larger font size for better readability
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#3f51b5', // Bright blue color for the question text
      textAlign: 'center',
      lineHeight: 32,
      fontFamily: 'Comic Sans MS', // Fun font for children
      textShadowColor: '#fff', // White shadow for a playful effect
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 5,
  },
  answerOption: {
      padding: 15,
      borderRadius: 15,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: '#3f51b5', // Blue border for options
      alignItems: 'center',
      backgroundColor: '#e0f7fa', // Light cyan background for options
      transition: 'background-color 0.3s ease', // Smooth transition for background color
  },
  answerText: {
      fontSize: 20, // Slightly larger font size for options
      color: '#000', // Black text color for contrast
      textAlign: 'center',
      fontWeight: '600', // Medium font weight
      fontFamily: 'Comic Sans MS', // Fun font for children
  },
  correctAnswer: {
      backgroundColor: '#4caf50', // Green background for correct answer
      borderColor: '#388e3c', // Darker border for correct answer
  },
  incorrectAnswer: {
      backgroundColor: '#f44336', // Red background for incorrect answer
      borderColor: '#c62828', // Darker border for incorrect answer
  },
  optionButtonSelected: {
      backgroundColor: '#00adb5', // Highlight selected option in teal
      borderColor: '#007BFF', // Darker border for selected option
  },
  optionText: {
      fontSize: 20, // Increased font size for better readability
      color: '#eeeeee', // Light text color for contrast
      textAlign: 'center', // Center align the option text
      fontWeight: '500', // Medium font weight
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
},
timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 20,
},
questionImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  optionImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },

  futuristicContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(15,32,39,0.85)', // dark, semi-transparent background
    borderWidth: 2,
    borderColor: '#00ffff', // neon cyan border
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  futuristicTimer: {
    fontSize: 36,             // Increased font size for impact
    fontWeight: '900',        // Extra bold for a strong futuristic look
    color: '#00ffff',         // Neon cyan color
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,     // Strong glow effect
    // This transform is static. To animate it, wrap your Text in Animated.Text and animate the scale value.
    transform: [{ scale: 1.2 }],
  },
  futuristicQuestionText: {
    fontSize: 20,
    color: '#ffffff',
    marginVertical: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  futuristicQuestionImage: {
    width: screenWidth - 40, // full width minus container margin (20*2)
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  futuristicAnswerOption: {
    backgroundColor: 'rgba(15,32,39,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  futuristicAnswerText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  futuristicOptionImage: {
    width: screenWidth - 80, // adjust if you want a margin inside option button
    height: 300,
    borderRadius: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  futuristicWaitingText: {
    fontSize: 20,
    color: '#00ffff',
    textAlign: 'center',
    marginTop: 20,
  },
// ... existing styles ...

background: {
    flex: 1,
    resizeMode: 'cover', // or 'stretch'
  },
  // board: {
  //   margin: 20,
  //   padding: 20,
  //   //backgroundColor: '#0f2027', // dark base color for a futuristic vibe
  //   borderRadius: 15,
  //   borderWidth: 2,
  //   borderColor: '#00ffff', // neon cyan border
  //   shadowColor: '#00ffff',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.8,
  //   shadowRadius: 10,
  //   elevation: 10, // for Android shadow
  //   marginTop:15,
  // },
  diceTimerContainer: {
    flexDirection: 'column', // this is default, but makes it explicit
    alignItems: 'center',    // center components horizontally
    marginTop: 20,           // adjust spacing as needed
  },
  redHome: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 6,
    borderColor: '#b43433',
  },
  greenHome: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 6,
    borderColor: '#33ab63',
  },
  yellowHome: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 6,
    borderColor: '#e0c550',
  },
  blueHome: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 6,
    borderColor: '#4258c8',
  },
  centerCell: {
    backgroundColor: 'transparent',
  },
  background1: {
    width: 360,
    height:360,  // 95% of screen width
    aspectRatio: 1, // Ensures it remains a perfect square
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'contain',
    marginTop:-40,
  },
  overlay1: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container1: {
    flex: 1,
    width:380,
    justifyContent: 'center',
    alignItems: 'center',
  },


});

