import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TimerDisplay = ({ timeToGet1, timeToGet2, timeToGet3, timeToGet4, timeToGet5, timeToGet6 }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Time to get:</Text>
            <Text style={styles.text}>1: {timeToGet1}s</Text>
            <Text style={styles.text}>2: {timeToGet2}s</Text>
            <Text style={styles.text}>3: {timeToGet3}s</Text>
            <Text style={styles.text}>4: {timeToGet4}s</Text>
            <Text style={styles.text}>5: {timeToGet5}s</Text>
            <Text style={styles.text}>6: {timeToGet6}s</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: -40,
        left: '50%',
        transform: [{ translateX: -50 }],
        backgroundColor: 'rgba(0, 0, 0, 0.0)', // Semi-transparent background
        borderRadius: 10,
        padding: 10,
        zIndex: 1000,
    },
    text: {
        fontSize: 21 ,
        color: '#fff',
        textAlign: 'center',
    },
});

export default TimerDisplay;