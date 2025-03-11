import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CountdownTimer = ({ initialTime, onComplete, value }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        setTimeLeft(initialTime); // Reset time left when initialTime changes
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    onComplete(); // Call the onComplete function when the timer reaches 0
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Cleanup the interval on unmount
    }, [initialTime, onComplete]); // Add onComplete to dependencies

    return (
        <View style={styles.container}>
            <Text style={styles.timerText}>{timeLeft} sec = {value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: '50%',
        transform: [{ translateX: -50 }],
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
        borderRadius: 10,
        padding: 10,
        zIndex: 1000,
    },
    timerText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
    },
});

export default CountdownTimer;