class Claim:
    def __init__(self, count=0, diceVal=0):
        self.count = count
        self.diceVal = diceVal

    def to_dict(self):
        return {
            'count': self.count,
            'diceVal': self.diceVal
        }